import { TILE_SIZE } from '~/constants'
import { ModelPrimitive } from '~/renderer/interfaces'

const wireTilePositions = []
for (let i = -32; i < 32; i++) {
  wireTilePositions.push(
    -32 * TILE_SIZE,
    0.01,
    i * TILE_SIZE,
    32 * TILE_SIZE,
    0.01,
    i * TILE_SIZE,
  )
}
for (let i = -32; i < 32; i++) {
  wireTilePositions.push(
    i * TILE_SIZE,
    0.01,
    -32 * TILE_SIZE,
    i * TILE_SIZE,
    0.01,
    32 * TILE_SIZE,
  )
}

export const tileGrid = {
  positions: new Float32Array(wireTilePositions),
  primitive: ModelPrimitive.Lines,
}
