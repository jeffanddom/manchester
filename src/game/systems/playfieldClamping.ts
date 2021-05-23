import { vec2 } from 'gl-matrix'

import { FrameState } from '~/apps/game/simulate'

export const update = (frameState: FrameState): void => {
  for (const id of frameState.stateDb.playfieldClamped) {
    const position = vec2.clone(frameState.stateDb.transforms.get(id)!.position)

    vec2.max(position, position, frameState.terrainLayer.minWorldPos())
    vec2.min(position, position, frameState.terrainLayer.maxWorldPos())

    frameState.stateDb.transforms.update(id, { position })
  }
}
