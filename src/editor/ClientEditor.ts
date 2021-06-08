import { vec3 } from 'gl-matrix'
import { mat4, vec2 } from 'gl-matrix'
import { vec4 } from 'gl-matrix'

import {
  TileType,
  entityTypeModel,
  tileTypeColor,
} from './components/tileComponent'
import { handleInput } from './handleInput'
import { PLAYER_COUNT } from './settings'
import { LocalState } from './state/LocalState'

import { ClientAssets } from '~/common/assets/ClientAssets'
import { Camera3d } from '~/common/Camera3d'
import { MAX_PREDICTED_FRAMES, SIMULATION_PERIOD_S } from '~/common/settings'
import { ClientMessage } from '~/editor/messages'
import { StateDb } from '~/editor/state/StateDb'
import { initSystems, updateSystems } from '~/editor/updateSystems'
import { ClientGameBase } from '~/engine/client/Client'
import { Renderable, RenderableType } from '~/engine/client/ClientRenderManager'
import { DedupLog } from '~/engine/client/DedupLog'
import { IDebugDrawWriter } from '~/engine/DebugDraw'
import { IKeyboard, IMouse } from '~/engine/input/interfaces'
import { ClientSimulator } from '~/engine/network/ClientSimulator'
import { IServerConnection } from '~/engine/network/ServerConnection'
import { ServerMessage } from '~/engine/network/ServerMessage'
import { SimulationPhase } from '~/engine/network/SimulationPhase'
import { ParticleConfig } from '~/engine/particles/interfaces'
import * as gltf from '~/engine/renderer/gltf'
import { IModelLoader } from '~/engine/renderer/ModelLoader'
import { Renderable2d } from '~/engine/renderer/Renderer2d'
import { UnlitObjectType } from '~/engine/renderer/Renderer3d'
import { Immutable } from '~/types/immutable'
import { Zero3 } from '~/util/math'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

export class ClientEditor implements ClientGameBase<ClientMessage> {
  stateDb: StateDb
  localState: LocalState

  serverConnection: IServerConnection<ClientMessage> | undefined
  playerNumber: number | undefined
  simulator: ClientSimulator<void>

  lastUpdateAt: number
  lastTickAt: number

  tickDurations: RunningAverage
  updateFrameDurations: RunningAverage

  camera: Camera3d
  keyboard: IKeyboard
  mouse: IMouse
  modelLoader: IModelLoader
  debugDraw: IDebugDrawWriter

  dedupLog: DedupLog

  constructor(config: {
    keyboard: IKeyboard
    mouse: IMouse
    modelLoader: IModelLoader
    debugDraw: IDebugDrawWriter
    viewportDimensions: Immutable<vec2>
  }) {
    this.camera = new Camera3d({
      viewportDimensions: config.viewportDimensions,
    })
    this.camera.setPos(vec3.fromValues(0, 12, 3))
    this.camera.setTarget(Zero3)

    this.keyboard = config.keyboard
    this.mouse = config.mouse
    this.modelLoader = config.modelLoader
    this.debugDraw = config.debugDraw

    this.stateDb = new StateDb()
    this.localState = { selectedTileType: TileType.Grass }

    this.serverConnection = undefined
    this.playerNumber = undefined

    this.simulator = new ClientSimulator({
      maxPredictedFrames: MAX_PREDICTED_FRAMES,
      onAllClientsReady: (playerNumber) => this.onAllClientsReady(playerNumber),
      simulate: (dt, frame, messages, phase) =>
        this.simulate(dt, frame, messages, phase),
    })

    this.lastUpdateAt = time.current()
    this.lastTickAt = time.current()

    this.tickDurations = new RunningAverage(3 * 60)
    this.updateFrameDurations = new RunningAverage(3 * 60)
    this.dedupLog = new DedupLog()
  }

  public setViewportDimensions(d: vec2): void {
    this.camera.setViewportDimensions(d)
  }

  public connectServer(conn: IServerConnection<ClientMessage>): void {
    this.serverConnection = conn
  }

  public getAllClientsReady(): boolean {
    return this.simulator.getAllClientsReady()
  }

  public sendClientMessage(m: ClientMessage): void {
    this.simulator.addClientMessage(m)
    this.serverConnection!.send(m)
  }

  public update(): void {
    const start = time.current()
    this.updateFrameDurations.sample(start - this.lastUpdateAt)
    this.lastUpdateAt = start

    let serverMessages: ServerMessage<ClientMessage>[] = []
    if (this.serverConnection !== undefined) {
      serverMessages = this.serverConnection.consume()
    }

    this.simulator.tick({
      dt: SIMULATION_PERIOD_S,
      stateDb: this.stateDb,
      serverMessages,
    })
  }

  private onAllClientsReady(playerNumber: number): void {
    this.playerNumber = playerNumber

    this.stateDb = new StateDb()
    initSystems(this.stateDb)
    this.stateDb.currentPlayer = this.playerNumber!

    for (let i = 0; i < PLAYER_COUNT; i++) {
      this.stateDb.registerEntity({
        gridPos: { x: 0, y: 0 },
        model: 'linetile',
        cursor: i + 1,
      })
    }

    this.stateDb.commitPrediction()

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
  }

  private simulate(
    dt: number,
    frame: number,
    messages: ClientMessage[],
    phase: SimulationPhase,
  ): void[] {
    if (phase === SimulationPhase.ClientPrediction) {
      handleInput(this, frame, dt)
    }

    updateSystems(
      {
        stateDb: this.stateDb,
        localState: this.localState,
        messages,
        frame,
        debugDraw: this.debugDraw,
        phase,
      },
      dt,
    )

    return []
  }

  public getWvTransform(out: mat4): mat4 {
    return this.camera.getWvTransform(out)
  }

  public getFov(): number {
    return this.camera.getFov()
  }

  public getRenderables(): Renderable[] {
    const res: Renderable[] = []
    const pos3 = vec3.create()

    for (const [id, model] of this.stateDb.models) {
      const p = this.stateDb.gridPos.get(id)!
      pos3[0] = p.x + 0.5
      pos3[1] = 0
      pos3[2] = p.y + 0.5

      const tile = this.stateDb.tiles.get(id)

      if (tile !== undefined) {
        res.push({
          type: RenderableType.Unlit,
          object: {
            type: UnlitObjectType.Model,
            modelName: model,
            model2World: mat4.fromTranslation(mat4.create(), pos3),
            color: tileTypeColor.get(tile.type)!,
          },
        })

        if (tile.entity !== undefined) {
          res.push({
            type: RenderableType.UniformColor,
            modelName: entityTypeModel.get(tile.entity)!,
            model2World: mat4.fromTranslation(mat4.create(), pos3),
            modelModifiers: {},
            color: [0, 1, 1, 1],
          })
        }
      }

      if (this.stateDb.cursors.get(id) !== undefined) {
        const tileColor = vec4.clone(
          tileTypeColor.get(this.localState.selectedTileType)!,
        )
        tileColor[3] = 0.75

        res.push(
          {
            type: RenderableType.Unlit,
            object: {
              type: UnlitObjectType.Model,
              modelName: 'tile',
              model2World: mat4.fromTranslation(mat4.create(), [
                pos3[0],
                0.5,
                pos3[2],
              ]),
              color: tileColor,
            },
          },
          {
            type: RenderableType.Unlit,
            object: {
              type: UnlitObjectType.Model,
              modelName: 'linetile',
              model2World: mat4.fromTranslation(mat4.create(), pos3),
              color: [1, 0, 1, 1],
            },
          },
        )
      }
    }

    return res
  }

  public getRenderables2d(): Renderable2d[] {
    return []
  }

  // Unused

  public emitParticles(
    _addParticle: (config: Immutable<ParticleConfig>) => void,
  ): void {
    // do nothing
  }
}
