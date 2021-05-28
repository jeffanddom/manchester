import { mat4 } from 'gl-matrix'
import { vec2 } from 'gl-matrix'

import { WeaponType } from './WeaponType'

import { EntityId } from '~/engine/state/EntityId'
import * as damageable from '~/game/components/Damageable'
import { Team } from '~/game/components/team'
import { Transform } from '~/game/components/Transform'
import { TILE_SIZE } from '~/game/constants'
import { makeBullet } from '~/game/entities/bullet'
import { FrameEventType } from '~/game/systems/FrameEvent'
import { FrameState } from '~/game/updateSystems'
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

export const update = (frameState: FrameState, dt: number): void => {
  const { stateDb } = frameState

  const turretIds = new SortedSet<EntityId>()
  for (const id of stateDb.friendlyTeam) {
    const position = stateDb.transforms.get(id)!.position
    const searchSpace: Aabb2 = [
      position[0] - RANGE,
      position[1] - RANGE,
      position[0] + RANGE,
      position[1] + RANGE,
    ]

    for (const turretId of stateDb.queryByWorldPos(searchSpace)) {
      if (stateDb.turrets.has(turretId)) {
        turretIds.add(turretId)
      }
    }
  }

  for (const id of turretIds) {
    const turret = stateDb.turrets.get(id)!
    const transform = stateDb.transforms.get(id)!
    const team = stateDb.teams.get(id)!

    // I. Find a target

    const shootables: { id: EntityId; transform: Immutable<Transform> }[] = []
    const searchSpace: Aabb2 = [
      transform.position[0] - RANGE,
      transform.position[1] - RANGE,
      transform.position[0] + RANGE,
      transform.position[1] + RANGE,
    ]

    for (const targetId of stateDb.queryByWorldPos(searchSpace)) {
      if (
        targetId === id ||
        !stateDb.targetables.has(targetId) ||
        stateDb.obscureds.has(targetId)
      ) {
        continue
      }

      const targetTransform = stateDb.transforms.get(targetId)!
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
      const candidateTeam = stateDb.teams.get(candidate.id)
      if (candidateTeam === Team.Neutral || candidateTeam === team) {
        return false
      }

      const lineOfSight: Immutable<[vec2, vec2]> = [
        transform.position,
        candidate.transform!.position,
      ]

      for (let i = 0; i < n; i++) {
        const closerDamageable = stateDb.damageables.get(shootables[i].id)!
        const closerTransform = stateDb.transforms.get(shootables[i].id)!

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

    frameState.stateDb.turrets.update(id, {
      orientation: newOrientation,
    })

    frameState.stateDb.entityModels.update(id, {
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
      frameState.stateDb.turrets.update(id, {
        cooldownTtl: turret.cooldownTtl - dt,
      })
      continue
    }

    frameState.stateDb.turrets.update(id, { cooldownTtl: COOLDOWN_PERIOD })

    const bulletPos = radialTranslate2(
      vec2.create(),
      transform.position,
      newOrientation,
      TILE_SIZE * 0.25,
    )

    stateDb.registerEntity(
      makeBullet({
        orientation: newOrientation,
        owner: id,
        config: {
          origin: bulletPos,
          type: WeaponType.Standard,
        },
      }),
    )

    frameState.frameEvents.push({
      type: FrameEventType.TurretShoot,
      position: vec2.clone(bulletPos),
      orientation: newOrientation,
    })
  }
}
