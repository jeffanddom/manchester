export type CursorUpdate = {
  x: number
  y: number
}

export interface ClientMessage {
  frame: number
  playerNumber: number
  cursor?: CursorUpdate
}
