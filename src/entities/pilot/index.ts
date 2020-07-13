import { vec2 } from 'gl-matrix'

import { PathRenderable } from '../components/PathRenderable'

import { TILE_SIZE } from '~/constants'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Destination } from '~/entities/pilot/Destination'
import { vec2FromValuesBatch } from '~/util/math'

export const make = (destination: vec2): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.destination = new Destination(destination)
  e.renderable = new PathRenderable(
    vec2FromValuesBatch([
      [0, -TILE_SIZE * 0.25],
      [TILE_SIZE * 0.25, 0],
      [0, TILE_SIZE * 0.25],
      [-TILE_SIZE * 0.25, 0],
    ]),
    'purple',
  )
  return e
}
