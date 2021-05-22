import { vec4 } from 'gl-matrix'

import { WeaponType } from '../WeaponType'

import { Renderable, RenderableType } from '~/engine/client/ClientRenderManager'
import { UnlitObjectType } from '~/engine/renderer/Renderer3d'
import { SimState } from '~/engine/sim/SimState'
import { mortarInRange } from '~/game/components/Bullet'

export const update = (
  playerNumber: number,
  simState: SimState,
): Renderable[] => {
  const id = simState.getPlayerId(playerNumber)
  if (id === undefined) {
    throw `Player ${playerNumber} has no entity ID`
  }

  const shooter = simState.shooters.get(id)
  if (shooter === undefined) {
    return []
  }

  const target = shooter.input.target
  if (target === undefined) {
    return []
  }

  const renderables: Renderable[] = []

  if (shooter.weaponType === WeaponType.Mortar) {
    const transform = simState.transforms.get(id)!

    if (
      mortarInRange({
        origin: transform.position,
        target: target,
      })
    ) {
      renderables.push({
        type: RenderableType.Unlit,
        object: {
          type: UnlitObjectType.Lines,
          // prettier-ignore
          positions: new Float32Array(octagon({ x: target[0], y: target[1], height: 1, scale: 1 })),
          color: vec4.fromValues(1, 1, 1, 1),
        },
      })
    } else {
      renderables.push({
        type: RenderableType.Unlit,
        object: {
          type: UnlitObjectType.Lines,
          // prettier-ignore
          positions: new Float32Array(cross({ x: target[0], y: target[1], height: 1, scale: 0.25 })),
          color: vec4.fromValues(1, 0, 0, 1),
        },
      })
    }
  } else {
    renderables.push({
      type: RenderableType.Unlit,
      object: {
        type: UnlitObjectType.Lines,
        // prettier-ignore
        positions: new Float32Array(cross({ x: target[0], y: target[1], height: 1, scale: 0.25 })),
        color: vec4.fromValues(1, 1, 1, 1),
      },
    })
  }

  return renderables
}

type LineParams = {
  x: number
  y: number
  scale: number
  height: number
}

const cross = ({ x, y, scale, height }: LineParams) => {
  // prettier-ignore
  return [
    x - scale, height, y - scale,
    x + scale, height, y + scale,
    x + scale, height, y - scale,
    x - scale, height, y + scale,
  ]
}
const octagon = ({ x, y, scale, height }: LineParams) => {
  // prettier-ignore
  return [
    // TOP 
    x - scale / 2, height, y - scale,
    x + scale / 2, height, y - scale,

    x + scale / 2, height, y - scale,
    x + scale, height, y - scale / 2,

    // RIGHT
    x + scale, height, y - scale / 2,
    x + scale, height, y + scale / 2,

    x + scale, height, y + scale / 2,
    x + scale / 2, height, y + scale,

    // BOTTOM
    x + scale / 2, height, y + scale,
    x - scale / 2, height, y + scale,

    x - scale / 2, height, y + scale,
    x - scale, height, y + scale / 2,

    // LEFT
    x - scale, height, y + scale / 2,
    x - scale, height, y - scale / 2,

    x - scale, height, y - scale / 2,
    x - scale / 2, height, y - scale,
  ]
}
