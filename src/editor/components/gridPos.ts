import { Immutable } from '~/types/immutable'

export interface GridPos {
  x: number
  y: number
}

export function cloneGridPos(src: Immutable<GridPos>): GridPos {
  return { x: src.x, y: src.y }
}
