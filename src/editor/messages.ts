import { TileType } from './components/tileComponent'

export type CursorUpdate = {
  x: number
  y: number
}

export type TileUpdate = {
  x: number
  y: number
  type: TileType
}

export interface ClientMessage {
  frame: number
  playerNumber: number
  cursorUpdate?: CursorUpdate
  tileUpdate?: TileUpdate
}
