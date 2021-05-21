import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix'

import { ClientAssets } from '~/assets/ClientAssets'
import { CommonAssets } from '~/assets/CommonAssets'
import { Camera3d } from '~/camera/Camera3d'
import { CameraController } from '~/client/CameraController'
import { Renderable, RenderableType } from '~/client/ClientRenderManager'
import { DedupLog } from '~/client/DedupLog'
import {
  CAMERA_MAX_Y_OFFSET,
  CAMERA_MIN_Y_OFFSET,
  CAMERA_Z_OFFSET,
  MAX_PREDICTED_FRAMES,
  SIMULATION_PERIOD_S,
  TILE_SIZE,
} from '~/constants'
import { IDebugDrawWriter } from '~/DebugDraw'
import { gameProgression, initMap } from '~/Game'
import { IKeyboard, IMouse } from '~/input/interfaces'
import { Map as GameMap } from '~/map/interfaces'
import { ClientMessage } from '~/network/ClientMessage'
import { IServerConnection } from '~/network/ServerConnection'
import { ServerMessage, ServerMessageType } from '~/network/ServerMessage'
import {
  BasicEmitter,
  BasicEmitterSettings,
} from '~/particles/emitters/BasicEmitter'
import { ParticleEmitter } from '~/particles/interfaces'
import * as gltf from '~/renderer/gltf'
import { IModelLoader } from '~/renderer/ModelLoader'
import { Primitive2d, Renderable2d, TextAlign } from '~/renderer/Renderer2d'
import { UnlitObjectType } from '~/renderer/Renderer3d'
import { SimState } from '~/sim/SimState'
import { SimulationPhase, SimulationStep } from '~/simulate'
import * as systems from '~/systems'
import { CursorMode } from '~/systems/client/playerInput'
import { FrameEvent, FrameEventType } from '~/systems/FrameEvent'
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
  simulationStep: SimulationStep
  simState: SimState
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
  allClientsReady: boolean

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

  dedupLog: DedupLog
  addEmitter: (emitter: ParticleEmitter) => void

  // Common game state
  currentLevel: number

  map: GameMap
  terrainLayer: terrain.Layer

  constructor(config: {
    keyboard: IKeyboard
    mouse: IMouse
    modelLoader: IModelLoader
    debugDraw: IDebugDrawWriter
    viewportDimensions: Immutable<vec2>
    addEmitter: (emitter: ParticleEmitter) => void
    simulationStep: SimulationStep
  }) {
    this.keyboard = config.keyboard
    this.mouse = config.mouse
    this.modelLoader = config.modelLoader
    this.debugDraw = config.debugDraw

    this.simulationStep = config.simulationStep
    this.simState = new SimState(aabb2.create())
    this.uncommittedMessageHistory = []
    this.playerInputState = { cursorMode: CursorMode.NONE }
    this.serverConnection = undefined
    this.playerNumber = undefined
    this.serverFrameUpdates = []
    this.committedFrame = -1
    this.simulationFrame = 0
    this.waitingForServer = false
    this.allClientsReady = false

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
    this.dedupLog = new DedupLog()
    this.addEmitter = config.addEmitter

    // Common
    this.currentLevel = 0

    this.map = GameMap.empty()
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
    this.map = GameMap.fromRaw(gameProgression[this.currentLevel])
    const worldOrigin = vec2.scale(vec2.create(), this.map.origin, TILE_SIZE)
    const dimensions = vec2.scale(vec2.create(), this.map.dimensions, TILE_SIZE)

    this.simState = new SimState([
      worldOrigin[0],
      worldOrigin[1],
      worldOrigin[0] + dimensions[0],
      worldOrigin[1] + dimensions[1],
    ])
    this.simState.currentPlayer = this.playerNumber!

    this.terrainLayer = initMap(this.simState, this.map)
    this.modelLoader.loadModel('terrain', this.terrainLayer.getModel())

    for (const m of [
      'bullet',
      'core',
      'mortar',
      'shiba',
      'tank',
      'tree',
      'turret',
      'wall',
    ]) {
      const gltfDoc = ClientAssets.models.get(m)
      if (gltfDoc === undefined) {
        throw `model not found: ${m}`
      }
      gltf.loadAllModels(this.modelLoader, gltfDoc)
    }

    const playerPos = vec3.create()
    this.getPlayerPos(playerPos)
    this.cameraController.reset(playerPos)

    // Add some environmental effects
    createEmitterSet({
      origin: vec3.create(),
      orientation: quat.fromEuler(quat.create(), 0, 230, 0),
      settings: CommonAssets.emitters.get('fallingLeaves')!,
      addEmitter: this.addEmitter,
    })
  }

  connectServer(conn: IServerConnection): void {
    this.serverConnection = conn
  }

  private getPlayerPos(out: vec3): void {
    if (this.playerNumber === undefined) {
      return // TODO: should be an error
    }

    const playerId = this.simState.getPlayerId(this.playerNumber)
    if (playerId === undefined) {
      return
    }

    const transform = this.simState.transforms.get(playerId)
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
    const offset = vec3.fromValues(0, this.zoomLevel, CAMERA_Z_OFFSET)
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
    this.zoomLevel = math.clamp(
      this.zoomLevel,
      CAMERA_MIN_Y_OFFSET,
      CAMERA_MAX_Y_OFFSET,
    )

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
    const frameEvents: Map<number, FrameEvent[]> = new Map()
    let serverMessages: ServerMessage[] = []
    if (this.serverConnection !== undefined) {
      serverMessages = this.serverConnection.consume()
    }

    if (!this.allClientsReady) {
      for (const msg of serverMessages) {
        if (msg.type === ServerMessageType.START_GAME) {
          this.playerNumber = msg.playerNumber
          this.allClientsReady = true

          this.startPlay()
        }
      }
      return
    }

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
      return
    }

    this.syncServerState(dt, frameEvents)
    this.framesAheadOfServer.sample(this.simulationFrame - this.committedFrame)

    systems.playerInput(this, this.simulationFrame)

    const nextFrameEvents: FrameEvent[] = []
    frameEvents.set(this.simulationFrame, nextFrameEvents)
    this.simulationStep(
      {
        simState: this.simState,
        messages: this.uncommittedMessageHistory.filter(
          (m) => m.frame === this.simulationFrame,
        ),
        frameEvents: nextFrameEvents,
        terrainLayer: this.terrainLayer,
        frame: this.simulationFrame,
        debugDraw: this.debugDraw,
        phase: SimulationPhase.ClientPrediction,
      },
      dt,
    )

    this.syncCameraToPlayer(dt)
    this.updateFrameSideEffects(frameEvents)

    this.simulationFrame++
  }

  syncServerState(dt: number, frameEvents: Map<number, FrameEvent[]>): void {
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

    this.simState.undoPrediction()

    for (const update of toProcess) {
      const nextFrameEvents: FrameEvent[] = []
      frameEvents.set(update.frame, nextFrameEvents)
      this.simulationStep(
        {
          simState: this.simState,
          messages: update.inputs,
          frameEvents: nextFrameEvents,
          terrainLayer: this.terrainLayer,
          frame: update.frame,
          debugDraw: this.debugDraw,
          phase: SimulationPhase.ClientAuthoritative,
        },
        dt,
      )
      this.committedFrame = update.frame
    }

    this.simState.commitPrediction()

    this.uncommittedMessageHistory = this.uncommittedMessageHistory.filter(
      (m) => m.frame > this.committedFrame,
    )

    // Repredict already-simulated frames
    for (let f = this.committedFrame + 1; f < this.simulationFrame; f++) {
      const nextFrameEvents: FrameEvent[] = []
      frameEvents.set(f, nextFrameEvents)

      this.simulationStep(
        {
          simState: this.simState,
          messages: this.uncommittedMessageHistory.filter((m) => m.frame === f),
          frameEvents: nextFrameEvents,
          terrainLayer: this.terrainLayer,
          frame: f,
          debugDraw: this.debugDraw,
          phase: SimulationPhase.ClientReprediction,
        },
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

    const tempQuat = quat.create()

    for (const [entityId, entityModel] of this.simState.entityModels) {
      const transform = this.simState.transforms.get(entityId)!
      const transform3 = this.simState.transform3s.get(entityId)

      const m2w = mat4.create()
      if (transform3 !== undefined) {
        mat4.fromRotationTranslation(
          m2w,
          transform3.orientation,
          transform3.position,
        )
      } else {
        mat4.fromRotationTranslation(
          m2w,
          // Orientation is a CW rotation on the XY plane. We need to negate it
          // when expressing it as a rotation on the XZ plane.
          quat.setAxisAngle(tempQuat, math.PlusY3, -transform.orientation),
          vec3.fromValues(transform.position[0], 0, transform.position[1]),
        )
      }

      res.push({
        type: RenderableType.UniformColor,
        modelName: entityModel.name,
        modelModifiers: entityModel.modifiers,
        model2World: m2w,
        color: entityModel.color,
      })
    }

    if (this.playerNumber !== undefined) {
      res.push(...systems.crosshair(this.playerNumber, this.simState))
    }

    return res
  }

  getRenderables2d(): Renderable2d[] {
    return [
      ...systems.playerHealthBar(this.simState, this.playerNumber!),
      ...systems.weaponDisplay(this.simState, this.playerNumber!),
    ]
  }

  sendClientMessage(m: ClientMessage): void {
    this.uncommittedMessageHistory.push(m)
    this.serverConnection!.send(m)
  }

  private updateFrameSideEffects(frameEvents: Map<number, FrameEvent[]>): void {
    // Non-simulation effects
    for (const [frameNumber, events] of frameEvents) {
      for (const event of events) {
        if (this.dedupLog.contains(frameNumber, event)) {
          continue
        }

        this.dedupLog.add(frameNumber, event)

        switch (event.type) {
          case FrameEventType.BulletHit:
            {
              const origin = vec3.fromValues(
                event.position[0],
                0.5,
                event.position[1],
              )
              createEmitterSet({
                origin,
                orientation: math.QuatIdentity,
                settings: CommonAssets.emitters.get('bulletExplosion')!,
                addEmitter: this.addEmitter,
              })
            }
            break

          case FrameEventType.EntityDestroyed:
            {
              const origin = vec3.fromValues(
                event.position[0],
                0.5,
                event.position[1],
              )
              const orientation = quat.fromEuler(quat.create(), 90, 0, 0)
              createEmitterSet({
                origin,
                orientation,
                settings: CommonAssets.emitters.get('entityExplosion')!,
                addEmitter: this.addEmitter,
              })
            }
            break

          case FrameEventType.MortarExplosion:
            {
              const origin = vec3.fromValues(
                event.position[0],
                0,
                event.position[1],
              )
              const orientation = quat.setAxisAngle(
                quat.create(),
                math.PlusX3,
                Math.PI / 2,
              )

              const settings = CommonAssets.emitters.get('mortarExplosion')!
              createEmitterSet({
                origin,
                orientation,
                settings,
                addEmitter: this.addEmitter,
              })
            }
            break

          case FrameEventType.TankShoot:
            {
            }
            break

          case FrameEventType.TurretShoot:
            {
              const origin = vec3.fromValues(
                event.position[0],
                0.8,
                event.position[1],
              )
              const orientation = quat.setAxisAngle(
                quat.create(),
                math.PlusY3,
                // Sim orientation is expressed as clockwise rotation on a 2D
                // plane, but it needs to be negated when the Y axis is translated
                // to the Z axis.
                -event.orientation,
              )

              const settings = CommonAssets.emitters.get('tankShot')!
              createEmitterSet({
                origin,
                orientation,
                settings,
                addEmitter: this.addEmitter,
              })
            }
            break
        }
      }
    }

    // GC de-duplication log
    // drop everything earlier than server committed frame - 1
  }
}

function createEmitterSet(params: {
  origin: Immutable<vec3>
  orientation: Immutable<quat>
  settings: Immutable<BasicEmitterSettings>[]
  addEmitter: (e: ParticleEmitter) => void
}): void {
  for (const s of params.settings) {
    params.addEmitter(new BasicEmitter(params.origin, params.orientation, s))
  }
}
