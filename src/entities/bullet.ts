import { vec2, vec4 } from 'gl-matrix'

import * as bullet from '~/components/Bullet'
import { BulletType } from '~/components/Bullet'
import * as transform from '~/components/Transform'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import { DamageAreaType } from '~/systems/damager'

const bulletColor: Record<BulletType, [number, number, number, number]> = {
  [BulletType.Standard]: [1, 0, 0, 1],
  [BulletType.Rocket]: [1, 1, 0.5, 1],
  [BulletType.Mortar]: [0.2, 0.2, 0.5, 1],
}

export const makeBullet = ({
  orientation,
  owner,
  config,
}: {
  orientation: number
  owner: EntityId
  config: bullet.BulletConfig
}): EntityComponents => {
  const e = makeDefaultEntity()

  e.moveable = true

  e.transform = transform.make()
  e.transform.position = vec2.clone(config.origin)
  e.transform.orientation = orientation

  e.bullet = bullet.make(config)

  e.entityModel = {
    name: 'bullet',
    color: vec4.fromValues(...bulletColor[config.type]),
    modifiers: {},
  }

  // Mortars don't do damage until they reach their target.
  if (config.type !== BulletType.Mortar) {
    e.damager = {
      damageValue: config.type === BulletType.Rocket ? 5 : 1,
      area: { type: DamageAreaType.Point },
      splash: false,
      immuneList: [owner],
    }
  }

  return e
}
