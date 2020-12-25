import { TILE_SIZE } from '~/constants'
import { ModelPrimitive } from '~/renderer/common'

const wcHalfSize = 0.5
const wcLowNW = [-wcHalfSize, -wcHalfSize, -wcHalfSize]
const wcLowNE = [wcHalfSize, -wcHalfSize, -wcHalfSize]
const wcLowSW = [-wcHalfSize, -wcHalfSize, wcHalfSize]
const wcLowSE = [wcHalfSize, -wcHalfSize, wcHalfSize]
const wcHighNW = [-wcHalfSize, wcHalfSize, -wcHalfSize]
const wcHighNE = [wcHalfSize, wcHalfSize, -wcHalfSize]
const wcHighSW = [-wcHalfSize, wcHalfSize, wcHalfSize]
const wcHighSE = [wcHalfSize, wcHalfSize, wcHalfSize]

export const wireCubeModel = {
  // "as const" convinces the typechecker that this property will not be
  // re-assigned.
  primitive: ModelPrimitive.Lines,

  // prettier-ignore
  positions: new Float32Array([
    ...wcLowNW, ...wcLowNE,
    ...wcLowNE, ...wcLowSE,
    ...wcLowSE, ...wcLowSW,
    ...wcLowSW, ...wcLowNW,

    ...wcHighNW, ...wcHighNE,
    ...wcHighNE, ...wcHighSE,
    ...wcHighSE, ...wcHighSW,
    ...wcHighSW, ...wcHighNW,          

    ...wcLowNE, ...wcHighNE,
    ...wcLowNW, ...wcHighNW,
    ...wcLowSE, ...wcHighSE,
    ...wcLowSW, ...wcHighSW,
  ]),
}

const wireTilePositions = []
for (let i = -32; i < 32; i++) {
  wireTilePositions.push(
    -32 * TILE_SIZE,
    0,
    i * TILE_SIZE,
    32 * TILE_SIZE,
    0,
    i * TILE_SIZE,
  )
}
for (let i = -32; i < 32; i++) {
  wireTilePositions.push(
    i * TILE_SIZE,
    0,
    -32 * TILE_SIZE,
    i * TILE_SIZE,
    0,
    32 * TILE_SIZE,
  )
}

export const wireTilesModel = {
  positions: new Float32Array(wireTilePositions),
  primitive: ModelPrimitive.Lines,
}
