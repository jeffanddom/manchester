import { vec2 } from 'gl-matrix'

export enum Direction {
  North = 'N',
  South = 'S',
  East = 'E',
  West = 'W',
}

export interface TransformData {
  orientation: number
  position: vec2
}
