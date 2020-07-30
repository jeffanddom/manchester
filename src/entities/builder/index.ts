import { vec2 } from 'gl-matrix'

import { Builder } from '~/entities/builder/Builder'
import { DefaultModelRenderable } from '~/entities/components/DefaultModelRenderable'
import { Transform } from '~/entities/components/Transform'
import { Entity } from '~/entities/Entity'
import * as models from '~/models'

export const make = (destination: vec2, host: string, path: vec2[]): Entity => {
  const e = new Entity()
  e.transform = new Transform()
  e.builder = new Builder(destination, host, path)
  e.renderable = new DefaultModelRenderable(models.builder)
  return e
}
