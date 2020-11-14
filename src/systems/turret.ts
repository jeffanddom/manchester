import { vec2 } from 'gl-matrix'

import * as damageable from '~/components/Damageable'
import { Team } from '~/components/team'
import { Transform } from '~/components/Transform'
import { TILE_SIZE } from '~/constants'
import { makeBullet } from '~/entities/bullet'
import { EntityId } from '~/entities/EntityId'
import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { SimState } from '~/simulate'
import { Immutable } from '~/types/immutable'
import { segmentToAabb } from '~/util/collision'
import { getAngle, radialTranslate2, rotateUntil } from '~/util/math'
import { SortedSet } from '~/util/SortedSet'

const TURRET_ROT_SPEED = Math.PI / 2
const RANGE = 300
const COOLDOWN_PERIOD = 0.33

export class TurretComponent {
  cooldownTtl: number

  constructor() {
    this.cooldownTtl = 0
  }

  clone(): TurretComponent {
    const c = new TurretComponent()
    c.cooldownTtl = this.cooldownTtl
    return c
  }
}

export const update = (
  simState: Pick<
    SimState,
    'entityManager' | 'frame' | 'registerParticleEmitter'
  >,
  dt: number,
): void => {
  const { entityManager, frame, registerParticleEmitter } = simState

  const turretIds = new SortedSet<EntityId>()
  for (const id of entityManager.friendlyTeam) {
    const position = entityManager.transforms.get(id)!.position
    const searchSpace: [vec2, vec2] = [
      vec2.sub(vec2.create(), position, vec2.fromValues(RANGE, RANGE)),
      vec2.add(vec2.create(), position, vec2.fromValues(RANGE, RANGE)),
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
    const turretOrigin = transform.position

    const searchSpace: [vec2, vec2] = [
      vec2.sub(vec2.create(), turretOrigin, vec2.fromValues(RANGE, RANGE)),
      vec2.add(vec2.create(), turretOrigin, vec2.fromValues(RANGE, RANGE)),
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
      if (vec2.distance(targetTransform.position, transform.position) > RANGE) {
        continue
      }

      shootables.push({
        id: targetId,
        transform: targetTransform,
      })
    }

    shootables.sort(
      (a, b) =>
        vec2.distance(a.transform!.position, transform.position) -
        vec2.distance(b.transform!.position, transform.position),
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

    if (!target) {
      continue
    }

    // II. Move toward target

    const newOrientation = rotateUntil({
      from: transform.orientation,
      to: getAngle(transform.position, target.transform!.position),
      amount: TURRET_ROT_SPEED * dt,
    })
    simState.entityManager.transforms.update(id, {
      orientation: newOrientation,
    })

    // III. Shoot at target

    entityManager.checkpoint(id)
    if (turret.cooldownTtl > 0) {
      turret.cooldownTtl -= dt
      continue
    }
    turret.cooldownTtl = COOLDOWN_PERIOD

    const bulletPos = radialTranslate2(
      vec2.create(),
      transform.position,
      newOrientation,
      TILE_SIZE * 0.25,
    )

    entityManager.register(
      makeBullet({
        position: bulletPos,
        orientation: newOrientation,
        owner: id,
      }),
    )

    if (registerParticleEmitter) {
      registerParticleEmitter({
        emitter: new ParticleEmitter({
          spawnTtl: 0.1,
          position: bulletPos,
          particleTtl: 0.065,
          particleRadius: 3,
          particleRate: 240,
          particleSpeedRange: [120, 280],
          orientation: newOrientation,
          arc: Math.PI / 4,
          colors: ['#FF9933', '#CCC', '#FFF'],
        }),
        entity: id,
        frame: frame,
      })
    }
  }
}
