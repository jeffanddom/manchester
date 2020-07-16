import { vec2 } from 'gl-matrix'

export enum PilotState {
  leaveHost,
  returnToHost,
}

export class Pilot {
  state: PilotState
  target: vec2
  host: string // Entity ID
  path: vec2[]

  constructor(target: vec2, host: string, path: vec2[]) {
    this.state = PilotState.leaveHost
    this.target = target
    this.host = host
    this.path = path
  }
}
