import { vec2 } from 'gl-matrix'

export enum BuilderState {
  leaveHost,
  returnToHost,
}

export class Builder {
  state: BuilderState
  target: vec2
  host: string // Entity ID
  path: vec2[]

  constructor(target: vec2, host: string, path: vec2[]) {
    this.state = BuilderState.leaveHost
    this.target = target
    this.host = host
    this.path = path
  }
}
