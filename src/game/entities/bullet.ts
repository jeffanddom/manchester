import { vec2, vec4 } from 'gl-matrix'

import {
  EntityComponents,
  makeDefaultEntity,
} from '~/engine/sim/EntityComponents'
import { EntityId } from '~/engine/sim/EntityId'
import * as bullet from '~/game/components/Bullet'
import { BulletType } from '~/game/components/Bullet'
import * as transform from '~/game/components/Transform'
import * as transform3 from '~/game/components/Transform3'
import { MORTAR_FIRING_HEIGHT } from '~/game/constants'
import { DamageAreaType } from '~/game/systems/damager'
import { WeaponType } from '~/game/systems/WeaponType'

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
