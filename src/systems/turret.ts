import { mat4 } from 'gl-matrix'
import { vec2 } from 'gl-matrix'

import { FrameEventType } from './FrameEvent'

import { BulletType } from '~/components/Bullet'
import * as damageable from '~/components/Damageable'
import { Team } from '~/components/team'
import { Transform } from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/bullet'
import { EntityId } from '~/entities/EntityId'
import { SimState } from '~/simulate'
import { Immutable } from '~/types/immutable'
import { Aabb2 } from '~/util/aabb2'
import { segmentToAabb } from '~/util/collision'
import { PlusY3, getAngle, radialTranslate2, rotateUntil } from '~/util/math'
import { SortedSet } from '~/util/SortedSet'

const TURRET_ROT_SPEED = Math.PI / 2
const RANGE = 12 * TILE_SIZE
const RANGE_SQUARED = RANGE * RANGE
const COOLDOWN_PERIOD = 0.33

export type TurretComponent = {
  cooldownTtl: number
  orientation: number
}

export function make(): TurretComponent {
  return { cooldownTtl: 0, orientation: 0 }
}

export function clone(t: TurretComponent): TurretComponent {
  return { cooldownTtl: t.cooldownTtl, orientation: t.orientation }
}

export const update = (simState: SimState, dt: number): void => {
  const { entityManager } = simState

  const turretIds = new SortedSet<EntityId>()
  for (const id of entityManager.friendlyTeam) {
    const position = entityManager.transforms.get(id)!.position
    const searchSpace: Aabb2 = [
      position[0] - RANGE,
      position[1] - RANGE,
      position[0] + RANGE,
      position[1] + RANGE,
    ]

    for (const turretId of entityManager.queryByWorldPos(searchSpace)) {
      if (entityManager.turrets.has(turretId)) {
        turretIds.add(turretId)
      }
    }
  }

  for (const id of turretIds) {
    const turret = entityManager.turrets.get(id)!
    const transform = entityManager.transforms.get(id)!
    const team = entityManager.teams.get(id)!

    // I. Find a target

    const shootables: { id: EntityId; transform: Immutable<Transform> }[] = []
    const searchSpace: Aabb2 = [
      transform.position[0] - RANGE,
      transform.position[1] - RANGE,
      transform.position[0] + RANGE,
      transform.position[1] + RANGE,
    ]

    for (const targetId of entityManager.queryByWorldPos(searchSpace)) {
      if (
        targetId === id ||
        !entityManager.targetables.has(targetId) ||
        entityManager.obscureds.has(targetId)
      ) {
        continue
      }

      const targetTransform = entityManager.transforms.get(targetId)!
      if (
        vec2.squaredDistance(targetTransform.position, transform.position) >
        RANGE_SQUARED
      ) {
        continue
      }

      shootables.push({
        id: targetId,
        transform: targetTransform,
      })
    }

    shootables.sort(
      (a, b) =>
        vec2.squaredDistance(a.transform!.position, transform.position) -
        vec2.squaredDistance(b.transform!.position, transform.position),
    )

    const target = shootables.find((candidate, n) => {
      const candidateTeam = entityManager.teams.get(candidate.id)
      if (candidateTeam === Team.Neutral || candidateTeam === team) {
        return false
      }

      const lineOfSight: Immutable<[vec2, vec2]> = [
        transform.position,
        candidate.transform!.position,
      ]

      for (let i = 0; i < n; i++) {
        const closerDamageable = entityManager.damageables.get(
          shootables[i].id,
        )!
        const closerTransform = entityManager.transforms.get(shootables[i].id)!

        if (
          segmentToAabb(
            lineOfSight,
            damageable.aabb(closerDamageable, closerTransform),
          )
        ) {
          return false
        }
      }

      return true
    })

    if (target === undefined) {
      continue
    }

    // II. Move toward target

    const newOrientation = rotateUntil({
      from: turret.orientation,
      to: getAngle(transform.position, target.transform!.position),
      amount: TURRET_ROT_SPEED * dt,
    })

    simState.entityManager.turrets.update(id, {
      orientation: newOrientation,
    })

    simState.entityManager.entityModels.update(id, {
      modifiers: {
        'turret.cannon_root:post': mat4.fromRotation(
          mat4.create(),

          // This angle is a rotation on the XY plane. We need to negate when moving to XZ.
          // It is applied against the tank's orientation to track the mouse at all angles.
          -newOrientation,
          PlusY3,
        ),
      },
    })

    // III. Shoot at target

    if (turret.cooldownTtl > 0) {
      simState.entityManager.turrets.update(id, {
        cooldownTtl: turret.cooldownTtl - dt,
      })
      continue
    }

    simState.entityManager.turrets.update(id, { cooldownTtl: COOLDOWN_PERIOD })

    const bulletPos = radialTranslate2(
      vec2.create(),
      transform.position,
      newOrientation,
      TILE_SIZE * 0.25,
    )

    entityManager.register(
      makeBullet({
        orientation: newOrientation,
        owner: id,
        config: {
          origin: bulletPos,
          type: BulletType.Standard,
        },
      }),
    )

    simState.frameEvents.push({
      type: FrameEventType.TurretShoot,
      position: vec2.clone(bulletPos),
      orientation: newOrientation,
    })
  }
}
