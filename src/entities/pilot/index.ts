import { vec2 } from 'gl-matrix'

import { PathRenderable } from '../components/PathRenderable'

import { TILE_SIZE } from '~/constants'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import { Pilot } from '~/entities/pilot/Pilot'
import { vec2FromValuesBatch } from '~/util/math'

export const make = (destination: vec2, host: string, path: vec2[]): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.pilot = new Pilot(destination, host, path)
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
