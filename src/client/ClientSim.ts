import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix'

import { CameraController } from './CameraController'

import { getGltfDocument } from '~/assets/models'
import { Camera3d } from '~/camera/Camera3d'
import { Renderable, RenderableType } from '~/client/ClientRenderManager'
import {
  MAX_PREDICTED_FRAMES,
  SIMULATION_PERIOD_S,
  TILE_SIZE,
} from '~/constants'
import { IDebugDrawWriter } from '~/DebugDraw'
import { EntityManager } from '~/entities/EntityManager'
import { GameState, gameProgression, initMap } from '~/Game'
import { IKeyboard, IMouse } from '~/input/interfaces'
import { Map } from '~/map/interfaces'
import { ClientMessage } from '~/network/ClientMessage'
import { IServerConnection } from '~/network/ServerConnection'
import { ServerMessage, ServerMessageType } from '~/network/ServerMessage'
import * as gltf from '~/renderer/gltf'
import { IModelLoader } from '~/renderer/ModelLoader'
import { Primitive2d, Renderable2d, TextAlign } from '~/renderer/Renderer2d'
import { UnlitObjectType } from '~/renderer/Renderer3d'
import { SimulationPhase, simulate } from '~/simulate'
import * as systems from '~/systems'
import { CursorMode } from '~/systems/client/playerInput'
import * as terrain from '~/terrain'
import { Immutable } from '~/types/immutable'
import * as aabb2 from '~/util/aabb2'
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
  uncommittedMessageHistory: ClientMessage[]
  playerInputState: {
    cursorMode: CursorMode
  }
  serverConnection: IServerConnection | undefined
  playerNumber: number | undefined
  serverFrameUpdates: ServerFrameUpdate[]
  committedFrame: number
  simulationFrame: number
  waitingForServer: boolean

  camera: Camera3d
  zoomLevel: number
  cameraController: CameraController
  emitterHistory: Set<string>

  lastUpdateAt: number
  lastTickAt: number
  serverUpdateFrameDurationAvg: number
  serverSimulationDurationAvg: number

  tickDurations: RunningAverage
  updateFrameDurations: RunningAverage
  framesAheadOfServer: RunningAverage

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

    this.entityManager = new EntityManager(aabb2.create())
    this.uncommittedMessageHistory = []
    this.playerInputState = { cursorMode: CursorMode.NONE }
    this.serverConnection = undefined
    this.playerNumber = undefined
    this.serverFrameUpdates = []
    this.committedFrame = -1
    this.simulationFrame = 0
    this.waitingForServer = false

    this.camera = new Camera3d({
      viewportDimensions: config.viewportDimensions,
    })
    this.zoomLevel = 12
    this.cameraController = new CameraController()
    this.emitterHistory = new Set()

    this.lastUpdateAt = time.current()
    this.lastTickAt = time.current()
    this.serverUpdateFrameDurationAvg = NaN
    this.serverSimulationDurationAvg = NaN

    this.tickDurations = new RunningAverage(3 * 60)
    this.updateFrameDurations = new RunningAverage(3 * 60)
    this.framesAheadOfServer = new RunningAverage(3 * 60)

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
  }

  shutdown(): void {
    this.serverConnection?.close()
  }

  setViewportDimensions(d: vec2): void {
    this.camera.setViewportDimensions(d)
  }

  startPlay(): void {
    // Level setup
    this.map = Map.fromRaw(gameProgression[this.currentLevel])
    const worldOrigin = vec2.scale(vec2.create(), this.map.origin, TILE_SIZE)
    const dimensions = vec2.scale(vec2.create(), this.map.dimensions, TILE_SIZE)

    this.entityManager = new EntityManager([
      worldOrigin[0],
      worldOrigin[1],
      worldOrigin[0] + dimensions[0],
      worldOrigin[1] + dimensions[1],
    ])
    this.entityManager.currentPlayer = this.playerNumber!

    this.terrainLayer = initMap(this.entityManager, this.map)
    this.modelLoader.loadModel('terrain', this.terrainLayer.getModel())

    for (const m of [
      'bullet',
      'core',
      'tank',
      'turret',
      'tree',
      'wall',
      'shiba',
    ]) {
      gltf.loadAllModels(this.modelLoader, getGltfDocument(m))
    }

    const playerPos = vec3.create()
    this.getPlayerPos(playerPos)
    this.cameraController.reset(playerPos)
  }

  setState(s: GameState): void {
    this.nextState = s
  }

  connectServer(conn: IServerConnection): void {
    this.serverConnection = conn
  }

  private getPlayerPos(out: vec3): void {
    if (this.playerNumber === undefined) {
      return // TODO: should be an error
    }

    const playerId = this.entityManager.getPlayerId(this.playerNumber)
    if (playerId === undefined) {
      return
    }

    const transform = this.entityManager.transforms.get(playerId)
    if (transform === undefined) {
      return
    }

    out[0] = transform.position[0]
    out[1] = 0
    out[2] = transform.position[1]
  }

  private syncCameraToPlayer(dt: number): void {
    const playerPos = vec3.create()
    this.getPlayerPos(playerPos)

    this.cameraController.setTarget(playerPos)
    this.cameraController.update(dt)

    const targetPos = vec3.create()
    this.cameraController.getPos(targetPos)

    // Position the 3D camera at a fixed offset from the player, and
    // point the camera directly at the player.
    const offset = vec3.fromValues(0, this.zoomLevel, 3)
    this.camera.setPos(vec3.add(vec3.create(), targetPos, offset))
    this.camera.setTarget(targetPos)
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
          type: UnlitObjectType.Model,
          modelName: 'linegrid',
          model2World: mat4.create(),
          color: vec4.fromValues(1, 1, 0, 0.3),
        },
      },
    ])

    this.zoomLevel += this.mouse.getScroll() * 0.025
    this.zoomLevel = math.clamp(this.zoomLevel, 3, 12)

    this.debugDraw.draw2d(() => {
      const text = [
        `Player ${this.playerNumber}`,
        // `Render ms: ${(this.renderDurations.average() * 1000).toFixed(2)}`,
        // `Render FPS: ${(1 / this.renderFrameDurations.average()).toFixed(2)}`,
        `Tick ms: ${(this.tickDurations.average() * 1000).toFixed(2)}`,
        `Update FPS: ${(1 / this.updateFrameDurations.average()).toFixed(2)}`,
        `FAOS: ${this.framesAheadOfServer.average().toFixed(2)}`,
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
    if (this.serverConnection !== undefined) {
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
                this.serverFrameUpdates.push({
                  frame: msg.frame,
                  inputs: msg.inputs,
                })
                this.serverFrameUpdates.sort((a, b) => a.frame - b.frame)

                this.serverUpdateFrameDurationAvg = msg.updateFrameDurationAvg
                this.serverSimulationDurationAvg = msg.simulationDurationAvg
                break

              case ServerMessageType.REMOTE_CLIENT_MESSAGE:
                this.uncommittedMessageHistory.push(msg.message)
                break
            }
          }

          this.waitingForServer =
            this.serverFrameUpdates.length === 0 &&
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
              messages: this.uncommittedMessageHistory.filter(
                (m) => m.frame === this.simulationFrame,
              ),
              frameEvents: [],
              terrainLayer: this.terrainLayer,
              frame: this.simulationFrame,
              debugDraw: this.debugDraw,
              phase: SimulationPhase.ClientPrediction,
            },
            this.state,
            dt,
          )

          this.syncCameraToPlayer(dt)
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

    // Process all contiguous server frames prior to the current simulation
    // frame
    let splitAt = 0
    while (splitAt < this.serverFrameUpdates.length) {
      if (this.serverFrameUpdates[splitAt].frame >= this.simulationFrame) {
        break
      }
      splitAt++
    }

    const toProcess = this.serverFrameUpdates.slice(0, splitAt)
    this.serverFrameUpdates = this.serverFrameUpdates.slice(splitAt)

    // Early-out if there are no server updates we can process right now.
    if (toProcess.length === 0) {
      return
    }

    this.entityManager.undoPrediction()

    for (const update of toProcess) {
      simulate(
        {
          entityManager: this.entityManager,
          messages: update.inputs,
          frameEvents: [],
          terrainLayer: this.terrainLayer,
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

    this.uncommittedMessageHistory = this.uncommittedMessageHistory.filter(
      (m) => m.frame > this.committedFrame,
    )

    // Repredict already-simulated frames
    for (let f = this.committedFrame + 1; f < this.simulationFrame; f++) {
      simulate(
        {
          entityManager: this.entityManager,
          messages: this.uncommittedMessageHistory.filter((m) => m.frame === f),
          frameEvents: [],
          terrainLayer: this.terrainLayer,
          frame: f,
          debugDraw: this.debugDraw,
          phase: SimulationPhase.ClientReprediction,
        },
        this.state,
        dt,
      )
    }
  }

  getRenderables(): Renderable[] {
    const res: Renderable[] = [
      {
        type: RenderableType.VColor,
        modelName: 'terrain',
        modelModifiers: {},
        model2World: mat4.create(),
      },
    ]

    for (const [entityId, entityModel] of this.entityManager.entityModels) {
      const transform = this.entityManager.transforms.get(entityId)!
      res.push({
        type: RenderableType.UniformColor,
        modelName: entityModel.name,
        modelModifiers: entityModel.modifiers,
        model2World: mat4.fromRotationTranslation(
          mat4.create(),
          quat.identity(quat.create()),
          vec3.fromValues(transform.position[0], 0, transform.position[1]),
        ),
        color: entityModel.color,
      })
    }

    return res
  }

  sendClientMessage(m: ClientMessage): void {
    this.uncommittedMessageHistory.push(m)
    this.serverConnection!.send(m)
  }
}
