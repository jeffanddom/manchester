import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix'

import { Camera3d } from '~/camera/Camera3d'
import { Renderable3d, Renderable3dV2 } from '~/client/ClientRenderManager'
import {
  MAX_PREDICTED_FRAMES,
  SIMULATION_PERIOD_S,
  TILE_SIZE,
} from '~/constants'
import { IDebugDrawWriter } from '~/DebugDraw'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, gameProgression, initMap } from '~/Game'
import { IKeyboard, IMouse } from '~/input/interfaces'
import { Map } from '~/map/interfaces'
import { getGltfDocument, getModel } from '~/models'
import { ClientMessage, ClientMessageType } from '~/network/ClientMessage'
import { IServerConnection } from '~/network/ServerConnection'
import { ServerMessage, ServerMessageType } from '~/network/ServerMessage'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { IModelLoader } from '~/renderer/ModelLoader'
import { Primitive2d, Renderable2d, TextAlign } from '~/renderer/Renderer2d'
import { SimulationPhase, simulate } from '~/simulate'
import * as systems from '~/systems'
import { CursorMode } from '~/systems/client/playerInput'
import * as terrain from '~/terrain'
import { Immutable } from '~/types/immutable'
import { discardUntil } from '~/util/array'
import * as math from '~/util/math'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

interface ServerFrameUpdate {
  frame: number
  inputs: ClientMessage[]
}

export class ClientSim {
  entityManager: EntityManager
  localMessageHistory: ClientMessage[]
  playerInputState: {
    cursorMode: CursorMode
  }
  serverConnection: IServerConnection | null
  playerNumber: number | undefined
  serverFrameUpdates: ServerFrameUpdate[]
  committedFrame: number
  simulationFrame: number
  waitingForServer: boolean

  camera: Camera3d
  emitters: ParticleEmitter[]
  emitterHistory: Set<string>

  lastUpdateAt: number
  lastTickAt: number
  serverUpdateFrameDurationAvg: number
  serverSimulationDurationAvg: number

  tickDurations: RunningAverage
  updateFrameDurations: RunningAverage
  framesAheadOfServer: RunningAverage
  serverInputsPerFrame: RunningAverage

  keyboard: IKeyboard
  mouse: IMouse
  modelLoader: IModelLoader
  debugDraw: IDebugDrawWriter

  // Common game state
  state: GameState
  nextState: GameState | undefined

  currentLevel: number

  map: Map
  terrainLayer: terrain.Layer

  constructor(config: {
    keyboard: IKeyboard
    mouse: IMouse
    modelLoader: IModelLoader
    debugDraw: IDebugDrawWriter
    viewportDimensions: Immutable<vec2>
  }) {
    this.keyboard = config.keyboard
    this.mouse = config.mouse
    this.modelLoader = config.modelLoader
    this.debugDraw = config.debugDraw

    this.entityManager = new EntityManager([
      [0, 0],
      [0, 0],
    ])
    this.localMessageHistory = []
    this.playerInputState = { cursorMode: CursorMode.NONE }
    this.serverConnection = null
    this.playerNumber = undefined
    this.serverFrameUpdates = []
    this.committedFrame = -1
    this.simulationFrame = 0
    this.waitingForServer = false

    this.camera = new Camera3d({
      viewportDimensions: config.viewportDimensions,
    })
    this.emitters = []
    this.emitterHistory = new Set()

    this.lastUpdateAt = time.current()
    this.lastTickAt = time.current()
    this.serverUpdateFrameDurationAvg = NaN
    this.serverSimulationDurationAvg = NaN

    this.tickDurations = new RunningAverage(3 * 60)
    this.updateFrameDurations = new RunningAverage(3 * 60)
    this.framesAheadOfServer = new RunningAverage(3 * 60)
    this.serverInputsPerFrame = new RunningAverage(3 * 60)

    // Common
    this.state = GameState.Connecting
    this.nextState = undefined

    this.currentLevel = 0

    this.map = Map.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      terrain: this.map.terrain,
    })

    // Depedency-injection binding
    this.registerParticleEmitter = this.registerParticleEmitter.bind(this)
  }

  shutdown(): void {
    this.serverConnection?.close()
  }

  setViewportDimensions(d: vec2): void {
    this.camera.setViewportDimensions(d)
  }

  startPlay(): void {
    this.emitters = []

    // Level setup
    this.map = Map.fromRaw(gameProgression[this.currentLevel])
    const worldOrigin = vec2.scale(vec2.create(), this.map.origin, TILE_SIZE)

    this.entityManager = new EntityManager([
      worldOrigin,
      vec2.add(
        vec2.create(),
        worldOrigin,
        vec2.scale(vec2.create(), this.map.dimensions, TILE_SIZE),
      ),
    ])
    this.entityManager.currentPlayer = this.playerNumber!

    this.terrainLayer = initMap(this.entityManager, this.map)
    this.modelLoader.loadModel(
      'terrain',
      this.terrainLayer.getModel(),
      'standard',
    )

    for (const m of ['bullet', 'core', 'tank', 'tree', 'turret', 'wall']) {
      this.modelLoader.loadModel(m, getModel(m), 'standard')
    }

    this.modelLoader.loadGltf(getGltfDocument('tank'))
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  connectServer(conn: IServerConnection): void {
    this.serverConnection = conn
  }

  update(): void {
    const start = time.current()
    this.updateFrameDurations.sample(start - this.lastUpdateAt)
    this.lastUpdateAt = start

    this.tick(SIMULATION_PERIOD_S)
    this.tickDurations.sample(time.current() - start)

    this.debugDraw.draw3d(() => [
      {
        object: {
          type: 'MODEL',
          id: 'wireTileGrid',
          color: vec4.fromValues(0, 1, 1, 1),
        },
      },
    ])

    this.debugDraw.draw2d(() => {
      const text = [
        `Player ${this.playerNumber}`,
        // `Render ms: ${(this.renderDurations.average() * 1000).toFixed(2)}`,
        // `Render FPS: ${(1 / this.renderFrameDurations.average()).toFixed(2)}`,
        `Tick ms: ${(this.tickDurations.average() * 1000).toFixed(2)}`,
        `Update FPS: ${(1 / this.updateFrameDurations.average()).toFixed(2)}`,
        `FAOS: ${this.framesAheadOfServer.average().toFixed(2)}`,
        `SIPF: ${this.serverInputsPerFrame.average().toFixed(2)}`,
        `Server sim ms: ${(this.serverSimulationDurationAvg * 1000).toFixed(
          2,
        )}`,
        `Server update FPS: ${(1 / this.serverUpdateFrameDurationAvg).toFixed(
          2,
        )}`,
        this.waitingForServer ? 'WAITING FOR SERVER' : undefined,
      ]

      const x = this.camera.getViewportDimensions()[0] - 10
      let y = 10
      const res: Renderable2d[] = []
      for (const t of text) {
        if (t === undefined) {
          continue
        }

        res.push({
          primitive: Primitive2d.TEXT,
          text: t,
          pos: vec2.fromValues(x, y),
          hAlign: TextAlign.Max,
          vAlign: TextAlign.Center,
          font: '16px monospace',
          style: 'cyan',
        })

        y += 20
      }

      return res
    })
  }

  tick(dt: number): void {
    let serverMessages: ServerMessage[] = []
    if (this.serverConnection !== null) {
      serverMessages = this.serverConnection.consume()
    }

    if (this.nextState !== undefined) {
      this.state = this.nextState
      this.nextState = undefined

      switch (this.state) {
        case GameState.Running:
          this.startPlay()
          break
        case GameState.YouDied:
          this.currentLevel = 0
          break
        case GameState.LevelComplete:
          // this.currentLevel = (this.currentLevel + 1) % Object.keys(maps).length
          break
      }
    }

    switch (this.state) {
      case GameState.Connecting:
        {
          for (const msg of serverMessages) {
            if (msg.type === ServerMessageType.START_GAME) {
              this.playerNumber = msg.playerNumber
              this.setState(GameState.Running)
              break
            }
          }
        }
        break
      case GameState.Running:
        {
          // push frame updates from server into list
          for (const msg of serverMessages) {
            switch (msg.type) {
              case ServerMessageType.FRAME_UPDATE:
                {
                  this.serverFrameUpdates.push({
                    frame: msg.frame,
                    inputs: msg.inputs,
                  })
                  this.serverFrameUpdates.sort((a, b) => a.frame - b.frame)

                  this.serverInputsPerFrame.sample(msg.inputs.length)
                  this.serverUpdateFrameDurationAvg = msg.updateFrameDurationAvg
                  this.serverSimulationDurationAvg = msg.simulationDurationAvg
                }
                break
            }
          }

          this.waitingForServer =
            this.serverFrameUpdates.length == 0 &&
            this.simulationFrame - this.committedFrame >= MAX_PREDICTED_FRAMES
          if (this.waitingForServer) {
            break
          }

          this.syncServerState(dt)
          this.framesAheadOfServer.sample(
            this.simulationFrame - this.committedFrame,
          )

          systems.playerInput(this, this.simulationFrame)

          simulate(
            {
              entityManager: this.entityManager,
              messages: this.localMessageHistory.filter(
                (m) => m.frame === this.simulationFrame,
              ),
              terrainLayer: this.terrainLayer,
              frame: this.simulationFrame,
              registerParticleEmitter: this.registerParticleEmitter,
              debugDraw: this.debugDraw,
              phase: SimulationPhase.ClientPrediction,
            },
            this.state,
            dt,
          )

          this.emitters = this.emitters.filter((e) => !e.dead)
          this.emitters.forEach((e) => e.update(dt))

          const playerId = this.entityManager.getPlayerId(this.playerNumber!)
          if (playerId !== undefined) {
            const transform = this.entityManager.transforms.get(playerId)!

            // Position the 3D camera at a fixed offset from the player, and
            // point the camera directly at the player.
            const offset = vec3.fromValues(0, 12, 3)
            this.camera.setPos(
              vec3.add(
                vec3.create(),
                vec3.fromValues(
                  transform.position[0],
                  0,
                  transform.position[1],
                ),
                offset,
              ),
            )
            this.camera.setOrientation(
              quat.fromEuler(
                quat.create(),
                // We want the value of b, which is a negative-value downward
                // rotation around the x-axis.
                // c ------------------
                // | \  b
                // | a \
                // |     \
                // |       \
                // |         \
                // ----------- p ------
                math.r2d(Math.atan2(offset[2], offset[1]) - Math.PI / 2),
                0,
                0,
              ),
            )
          }

          // server message cleanup
          this.serverFrameUpdates = this.serverFrameUpdates.filter(
            (m) => m.frame <= this.simulationFrame,
          )

          this.serverConnection!.send({
            type: ClientMessageType.FRAME_END,
            frame: this.simulationFrame,
          })

          this.simulationFrame++
        }
        break
    }
  }

  syncServerState(dt: number): void {
    this.serverFrameUpdates = discardUntil(
      this.serverFrameUpdates,
      (u) => u.frame > this.committedFrame,
    )

    // Process all contiguous server frames
    const toProcess: ServerFrameUpdate[] = []
    const deferred: ServerFrameUpdate[] = []
    for (const update of this.serverFrameUpdates) {
      const wantFrame =
        toProcess.length > 0
          ? toProcess[toProcess.length - 1].frame + 1
          : this.committedFrame + 1

      if (update.frame === wantFrame) {
        toProcess.push(update)
      } else {
        deferred.push(update)
      }
    }

    // Early-out if there are no server updates we can process right now.
    if (toProcess.length === 0) {
      return
    }

    // Save future frames for later
    this.serverFrameUpdates = deferred

    this.entityManager.undoPrediction()

    for (const update of toProcess) {
      simulate(
        {
          entityManager: this.entityManager,
          messages: update.inputs,
          terrainLayer: this.terrainLayer,
          registerParticleEmitter: this.registerParticleEmitter,
          frame: update.frame,
          debugDraw: this.debugDraw,
          phase: SimulationPhase.ClientAuthoritative,
        },
        this.state,
        dt,
      )
      this.committedFrame = update.frame
    }

    this.entityManager.commitPrediction()

    this.localMessageHistory = discardUntil(
      this.localMessageHistory,
      (m) => m.frame > this.committedFrame,
    )

    // Repredict already-simulated frames
    for (let f = this.committedFrame + 1; f < this.simulationFrame; f++) {
      simulate(
        {
          entityManager: this.entityManager,
          messages: this.localMessageHistory.filter((m) => m.frame === f),
          terrainLayer: this.terrainLayer,
          registerParticleEmitter: this.registerParticleEmitter,
          frame: f,
          debugDraw: this.debugDraw,
          phase: SimulationPhase.ClientReprediction,
        },
        this.state,
        dt,
      )
    }
  }

  getRenderables3d(): Iterable<Renderable3d> {
    // TODO: reimplement as lazy iterable?
    const res: Renderable3d[] = []

    // Add terrain
    res.push({ modelId: 'terrain', posXY: vec2.create(), rotXY: 0 })

    for (const [entityId, modelId] of this.entityManager.renderables) {
      const transform = this.entityManager.transforms.get(entityId)!
      res.push({
        modelId,
        posXY: transform.position,
        rotXY: transform.orientation,
      })
    }

    return res
  }

  getRenderables3dV2(): Iterable<Renderable3dV2> {
    // TODO: reimplement as lazy iterable?
    const res: Renderable3dV2[] = []

    for (const [entityId, entityModel] of this.entityManager.entityModels) {
      const transform = this.entityManager.transforms.get(entityId)!
      res.push({
        modelId: entityModel.name,
        modelModifiers: entityModel.modifiers,
        model2World: mat4.fromRotationTranslation(
          mat4.create(),
          // We have to negate rotXY here. Positive rotations on the XY plane
          // represent right-handed rotations around cross(+X, +Y), whereas
          // positive rotations on the XZ plane represent right-handed rotations
          // around cross(+X, -Z).
          quat.rotateY(quat.create(), quat.create(), -transform.orientation),
          vec3.fromValues(transform.position[0], 0, transform.position[1]),
        ),
        color: vec4.fromValues(0, 0.6, 0.6, 1),
      })
    }

    return res
  }

  registerParticleEmitter(params: {
    emitter: ParticleEmitter
    entity: EntityId
    frame: number
  }): void {
    if (!this.emitterHistory.has(`${params.frame}:${params.entity}`)) {
      this.emitterHistory.add(`${params.frame}:${params.entity}`)
      this.emitters.push(params.emitter)
    }
  }

  sendClientMessage(m: ClientMessage): void {
    this.localMessageHistory.push(m)
    this.serverConnection!.send(m)
  }
}
