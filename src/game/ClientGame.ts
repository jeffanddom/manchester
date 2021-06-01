import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix'

import { ClientSimulator } from '../engine/network/ClientSimulator'
import { SimulationPhase } from '../engine/network/SimulationPhase'

import { updateSystems } from './updateSystems'

import { ClientAssets } from '~/common/assets/ClientAssets'
import { CommonAssets } from '~/common/assets/CommonAssets'
import { Camera3d } from '~/common/Camera3d'
import { ClientGameBase } from '~/engine/client/Client'
import { Renderable, RenderableType } from '~/engine/client/ClientRenderManager'
import { DedupLog } from '~/engine/client/DedupLog'
import { IDebugDrawWriter } from '~/engine/DebugDraw'
import { IKeyboard, IMouse } from '~/engine/input/interfaces'
import { ClientMessage } from '~/engine/network/ClientMessage'
import { IServerConnection } from '~/engine/network/ServerConnection'
import { ServerMessage } from '~/engine/network/ServerMessage'
import {
  BasicEmitter,
  BasicEmitterSettings,
} from '~/engine/particles/emitters/BasicEmitter'
import { ParticleConfig, ParticleEmitter } from '~/engine/particles/interfaces'
import * as gltf from '~/engine/renderer/gltf'
import { IModelLoader } from '~/engine/renderer/ModelLoader'
import {
  Primitive2d,
  Renderable2d,
  TextAlign,
} from '~/engine/renderer/Renderer2d'
import { UnlitObjectType } from '~/engine/renderer/Renderer3d'
import * as terrain from '~/engine/terrain'
import { gameProgression, initMap } from '~/game/common'
import {
  CAMERA_MAX_Y_OFFSET,
  CAMERA_MIN_Y_OFFSET,
  CAMERA_Z_OFFSET,
  MAX_PREDICTED_FRAMES,
  SIMULATION_PERIOD_S,
  TILE_SIZE,
} from '~/game/constants'
import { Map as GameMap } from '~/game/map/interfaces'
import { StateDb } from '~/game/state/StateDb'
import * as systems from '~/game/systems'
import * as emitter from '~/game/systems/emitter'
import {
  FrameEvent,
  FrameEventType,
  frameEventToKey,
} from '~/game/systems/FrameEvent'
import { CameraController } from '~/game/util/CameraController'
import { Immutable } from '~/types/immutable'
import * as aabb2 from '~/util/aabb2'
import * as math from '~/util/math'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

export class ClientGame implements ClientGameBase {
  stateDb: StateDb

  serverConnection: IServerConnection | undefined
  playerNumber: number | undefined
  simulator: ClientSimulator<FrameEvent>

  camera: Camera3d
  zoomLevel: number
  cameraController: CameraController
  emitterHistory: Set<string>

  lastUpdateAt: number
  lastTickAt: number

  tickDurations: RunningAverage
  updateFrameDurations: RunningAverage

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
  }) {
    this.keyboard = config.keyboard
    this.mouse = config.mouse
    this.modelLoader = config.modelLoader
    this.debugDraw = config.debugDraw

    this.stateDb = new StateDb(aabb2.create())
    this.serverConnection = undefined
    this.playerNumber = undefined

    this.simulator = new ClientSimulator({
      maxPredictedFrames: MAX_PREDICTED_FRAMES,
      onAllClientsReady: (playerNumber) => this.onAllClientsReady(playerNumber),
      simulate: (dt, frame, messages, phase) =>
        this.simulate(dt, frame, messages, phase),
    })

    this.camera = new Camera3d({
      viewportDimensions: config.viewportDimensions,
    })
    this.zoomLevel = 12
    this.cameraController = new CameraController()
    this.emitterHistory = new Set()

    this.lastUpdateAt = time.current()
    this.lastTickAt = time.current()

    this.tickDurations = new RunningAverage(3 * 60)
    this.updateFrameDurations = new RunningAverage(3 * 60)
    this.dedupLog = new DedupLog()
    this.addEmitter = config.addEmitter

    // Common
    this.currentLevel = 0

    this.map = GameMap.empty()
    this.terrainLayer = new terrain.Layer({
      tileOrigin: vec2.create(),
      tileDimensions: vec2.create(),
      tileSize: TILE_SIZE,
      terrain: this.map.terrain,
    })
  }

  public setViewportDimensions(d: vec2): void {
    this.camera.setViewportDimensions(d)
  }

  public connectServer(conn: IServerConnection): void {
    this.serverConnection = conn
  }

  public getAllClientsReady(): boolean {
    return this.simulator.getAllClientsReady()
  }

  public sendClientMessage(m: ClientMessage): void {
    this.simulator.addClientMessage(m)
    this.serverConnection!.send(m)
  }

  private getPlayerPos(out: vec3): void {
    if (this.playerNumber === undefined) {
      return // TODO: should be an error
    }

    const playerId = this.stateDb.getPlayerId(this.playerNumber)
    if (playerId === undefined) {
      return
    }

    const transform = this.stateDb.transforms.get(playerId)
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

  public update(): void {
    const start = time.current()
    this.updateFrameDurations.sample(start - this.lastUpdateAt)
    this.lastUpdateAt = start

    let serverMessages: ServerMessage[] = []
    if (this.serverConnection !== undefined) {
      serverMessages = this.serverConnection.consume()
    }

    const eventsByFrame = this.simulator.tick({
      dt: SIMULATION_PERIOD_S,
      stateDb: this.stateDb,
      serverMessages,
    })

    this.syncCameraToPlayer(SIMULATION_PERIOD_S)
    this.updateFrameSideEffects(eventsByFrame)

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
      const simulatorInfo = this.simulator.getDiagnostics()

      const text = [
        `Player ${this.playerNumber}`,
        // `Render ms: ${(this.renderDurations.average() * 1000).toFixed(2)}`,
        // `Render FPS: ${(1 / this.renderFrameDurations.average()).toFixed(2)}`,
        `Tick ms: ${(this.tickDurations.average() * 1000).toFixed(2)}`,
        `Update FPS: ${(1 / this.updateFrameDurations.average()).toFixed(2)}`,
        `FAOS: ${simulatorInfo.framesAheadOfServer.toFixed(2)}`,
        `Server sim ms: ${(
          simulatorInfo.serverSimulationDurationAvg * 1000
        ).toFixed(2)}`,
        `Server update FPS: ${(
          1 / simulatorInfo.serverUpdateFrameDurationAvg
        ).toFixed(2)}`,
        this.simulator.getWaitingForServer() ? 'WAITING FOR SERVER' : undefined,
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

  private onAllClientsReady(playerNumber: number): void {
    this.playerNumber = playerNumber

    // Level setup
    this.map = GameMap.fromRaw(gameProgression[this.currentLevel])
    const worldOrigin = vec2.scale(vec2.create(), this.map.origin, TILE_SIZE)
    const dimensions = vec2.scale(vec2.create(), this.map.dimensions, TILE_SIZE)

    this.stateDb = new StateDb([
      worldOrigin[0],
      worldOrigin[1],
      worldOrigin[0] + dimensions[0],
      worldOrigin[1] + dimensions[1],
    ])
    this.stateDb.currentPlayer = this.playerNumber!

    this.terrainLayer = initMap(this.stateDb, this.map)
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
      const gltfDoc = ClientAssets.gltfs.get(m)
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

  private simulate(
    dt: number,
    frame: number,
    messages: ClientMessage[],
    phase: SimulationPhase,
  ): FrameEvent[] {
    if (phase === SimulationPhase.ClientPrediction) {
      systems.playerInput(this, frame)
    }

    const frameEvents: FrameEvent[] = []
    updateSystems(
      {
        stateDb: this.stateDb,
        messages,
        frameEvents,
        terrainLayer: this.terrainLayer,
        frame,
        debugDraw: this.debugDraw,
        phase,
      },
      dt,
    )

    return frameEvents
  }

  public getWvTransform(out: mat4): mat4 {
    return this.camera.getWvTransform(out)
  }

  public getFov(): number {
    return this.camera.getFov()
  }

  public getRenderables(): Renderable[] {
    const res: Renderable[] = [
      {
        type: RenderableType.VColor,
        modelName: 'terrain',
        modelModifiers: {},
        model2World: mat4.create(),
      },
    ]

    const tempQuat = quat.create()

    for (const [entityId, entityModel] of this.stateDb.entityModels) {
      const transform = this.stateDb.transforms.get(entityId)!
      const transform3 = this.stateDb.transform3s.get(entityId)

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
      res.push(...systems.crosshair(this.playerNumber, this.stateDb))
    }

    return res
  }

  public getRenderables2d(): Renderable2d[] {
    return [
      ...systems.playerHealthBar(this.stateDb, this.playerNumber!),
      ...systems.weaponDisplay(this.stateDb, this.playerNumber!),
    ]
  }

  public emitParticles(
    addParticle: (config: Immutable<ParticleConfig>) => void,
  ): void {
    emitter.emitParticles(this.stateDb, addParticle)
  }

  private updateFrameSideEffects(frameEvents: Map<number, FrameEvent[]>): void {
    // Non-simulation effects
    for (const [frameNumber, events] of frameEvents) {
      for (const event of events) {
        if (this.dedupLog.contains(frameNumber, frameEventToKey(event))) {
          continue
        }

        this.dedupLog.add(frameNumber, frameEventToKey(event))

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
