import { vec4 } from 'gl-matrix'

import { Renderable, RenderableType } from '~/client/ClientRenderManager'
import { BulletType, mortarInRange } from '~/components/Bullet'
import { EntityManager } from '~/entities/EntityManager'
import { UnlitObjectType } from '~/renderer/Renderer3d'

export const update = (entityManger: EntityManager): Renderable[] => {
  const renderables: Renderable[] = []

  for (const [id, shooter] of entityManger.shooters) {
    const target = shooter.input.target
    if (target !== undefined) {
      if (shooter.bulletType === BulletType.Mortar) {
        const transform = entityManger.transforms.get(id)!

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

      const cursor: Renderable = {
        type: RenderableType.Unlit,
        object: {
          type: UnlitObjectType.Lines,
          // prettier-ignore
          positions: new Float32Array(),
          color: vec4.fromValues(1, 1, 1, 1),
        },
      }

      renderables.push(cursor)
    }
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
