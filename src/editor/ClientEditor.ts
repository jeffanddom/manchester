import { mat4, vec2 } from 'gl-matrix'

import {
  MAX_PREDICTED_FRAMES,
  SIMULATION_PERIOD_S,
  TILE_SIZE,
} from '~/common/settings'
import { StateDb } from '~/editor/state/StateDb'
import { initSystems, updateSystems } from '~/editor/updateSystems'
import { ClientGameBase } from '~/engine/client/Client'
import { Renderable, RenderableType } from '~/engine/client/ClientRenderManager'
import { DedupLog } from '~/engine/client/DedupLog'
import { IDebugDrawWriter } from '~/engine/DebugDraw'
import { IKeyboard, IMouse } from '~/engine/input/interfaces'
import { ClientMessage } from '~/engine/network/ClientMessage'
import { ClientSimulator } from '~/engine/network/ClientSimulator'
import { IServerConnection } from '~/engine/network/ServerConnection'
import { ServerMessage } from '~/engine/network/ServerMessage'
import { SimulationPhase } from '~/engine/network/SimulationPhase'
import { ParticleConfig } from '~/engine/particles/interfaces'
import { IModelLoader } from '~/engine/renderer/ModelLoader'
import { Renderable2d } from '~/engine/renderer/Renderer2d'
import * as terrain from '~/engine/terrain'
import { CommonAssets } from '~/game/assets/CommonAssets'
import { Map as GameMap } from '~/game/map/interfaces'
import { Immutable } from '~/types/immutable'
import * as math from '~/util/math'
import { RunningAverage } from '~/util/RunningAverage'
import * as time from '~/util/time'

export class ClientEditor implements ClientGameBase {
  stateDb: StateDb

  serverConnection: IServerConnection | undefined
  playerNumber: number | undefined
  simulator: ClientSimulator<void>

  lastUpdateAt: number
  lastTickAt: number

  tickDurations: RunningAverage
  updateFrameDurations: RunningAverage

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
    this.keyboard = config.keyboard
    this.mouse = config.mouse
    this.modelLoader = config.modelLoader
    this.debugDraw = config.debugDraw

    this.stateDb = new StateDb()
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

  public setViewportDimensions(_d: vec2): void {
    // this.camera.setViewportDimensions(d)
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

  public update(): void {
    const start = time.current()
    this.updateFrameDurations.sample(start - this.lastUpdateAt)
    this.lastUpdateAt = start

    let serverMessages: ServerMessage[] = []
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

    const map = GameMap.fromRaw(CommonAssets.maps.get('bigMap')!)
    const terrainLayer = new terrain.Layer({
      tileOrigin: map.origin,
      tileDimensions: map.dimensions,
      tileSize: TILE_SIZE,
      terrain: map.terrain,
    })
    this.modelLoader.loadModel('terrain', terrainLayer.getModel())

    initSystems(this.stateDb)
    // this.stateDb.currentPlayer = this.playerNumber!
  }

  private simulate(
    dt: number,
    frame: number,
    messages: ClientMessage[],
    phase: SimulationPhase,
  ): void[] {
    if (phase === SimulationPhase.ClientPrediction) {
      // systems.playerInput(this, frame)
    }

    updateSystems(
      {
        stateDb: this.stateDb,
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
    mat4.targetTo(out, [0, 12, 3], math.Zero3, math.PlusY3)
    mat4.invert(out, out)
    return out
  }

  public getFov(): number {
    // return this.camera.getFov()
    return (90 * Math.PI) / 180
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
