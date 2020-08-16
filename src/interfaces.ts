export enum DirectionCollision {
  North = 'N',
  South = 'S',
  East = 'E',
  West = 'W',
}

export enum DirectionMove {
  N = 0,
  NE = -Math.PI / 4,
  E = -Math.PI / 2,
  SE = Math.PI + Math.PI / 4,
  S = Math.PI,
  SW = Math.PI - Math.PI / 4,
  W = Math.PI / 2,
  NW = Math.PI / 4,
}
