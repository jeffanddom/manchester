import { vec2, vec4 } from 'gl-matrix'

import * as bullet from '~/components/Bullet'
import { BulletType } from '~/components/Bullet'
import * as transform from '~/components/Transform'
import * as transform3 from '~/components/Transform3'
import { MORTAR_FIRING_HEIGHT } from '~/constants'
import {
  EntityComponents,
  makeDefaultEntity,
} from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import { DamageAreaType } from '~/systems/damager'
import { WeaponType } from '~/systems/WeaponType'

const bulletColor: Record<BulletType, [number, number, number, number]> = {
  [WeaponType.Standard]: [1, 0, 0, 1],
  [WeaponType.Rocket]: [1, 1, 0.5, 1],
  [WeaponType.Mortar]: [0.2, 0.2, 0.5, 1],
}

const bulletModel: Record<BulletType, string> = {
  [WeaponType.Standard]: 'bullet',
  [WeaponType.Rocket]: 'bullet',
  [WeaponType.Mortar]: 'mortar',
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
    name: bulletModel[config.type],
    color: vec4.fromValues(...bulletColor[config.type]),
    modifiers: {},
  }

  // Mortars don't do damage until they reach their target.
  if (config.type !== WeaponType.Mortar) {
    e.damager = {
      damageValue: config.type === WeaponType.Rocket ? 5 : 1,
      area: { type: DamageAreaType.Point },
      splash: false,
      immuneList: [owner],
    }
  }

  // Mortar 3D animation
  if (config.type === WeaponType.Mortar) {
    e.transform3 = transform3.make()
    e.transform3.position[0] = config.origin[0]
    e.transform3.position[1] = MORTAR_FIRING_HEIGHT
    e.transform3.position[2] = config.origin[1]
  }

  return e
}
