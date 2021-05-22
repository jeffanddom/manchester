import { vec2 } from 'gl-matrix'

import { FrameState } from '~/apps/game/simulate'

export const update = (simState: FrameState): void => {
  for (const id of simState.simState.playfieldClamped) {
    const position = vec2.clone(simState.simState.transforms.get(id)!.position)

    vec2.max(position, position, simState.terrainLayer.minWorldPos())
    vec2.min(position, position, simState.terrainLayer.maxWorldPos())

    simState.simState.transforms.update(id, { position })
  }
}
