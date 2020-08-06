import { vec2 } from 'gl-matrix'

export enum BuilderMode {
  HARVEST,
  BUILD_TURRET,
  MOVE,
}

export enum BuilderState {
  leaveHost,
  returnToHost,
}

export class Builder {
  mode: BuilderMode
  state: BuilderState
  target: vec2
  host: string // Entity ID
  path: vec2[]

  constructor(params: {
    mode: BuilderMode
    target: vec2
    host: string
    path: vec2[]
  }) {
    this.mode = params.mode
    this.state = BuilderState.leaveHost
    this.target = params.target
    this.host = params.host
    this.path = params.path
  }
}
