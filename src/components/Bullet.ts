import { vec2, vec3 } from 'gl-matrix'

import {
  MORTAR_FIRING_HEIGHT,
  MORTAR_GRAVITY,
  MORTAR_MUZZLE_SPEED,
} from '~/constants'
import { Immutable } from '~/types/immutable'

export enum BulletType {
  Standard,
  Rocket,
  Mortar,
}
export const BULLET_TYPE_LENGTH = Object.values(BulletType).length / 2

export type Bullet = {
  origin: vec2
  lifetime: number
  type: BulletType

  // rocket only
  currentSpeed?: number

  // mortar only
  vel?: vec3
}

export interface StandardConfig {
  type: BulletType.Standard
  origin: vec2
}

export interface RocketConfig {
  type: BulletType.Rocket
  origin: vec2
}

export interface MortarConfig {
  type: BulletType.Mortar
  origin: vec2
  target: vec2
}

export type BulletConfig = StandardConfig | RocketConfig | MortarConfig

export function make(config: BulletConfig): Bullet {
  const bullet: Bullet = {
    origin: vec2.clone(config.origin),
    lifetime: 0,
    type: config.type,
  }

  if (config.type === BulletType.Mortar) {
    const delta = vec2.sub(vec2.create(), config.target, config.origin)
    const dist = vec2.length(delta)

    // Here's the math for this:
    // https://qr.ae/pGhqrV
    // const theta =
    //   Math.asin(
    //     (-MORTAR_GRAVITY * dist) /
    //       (2 * MORTAR_MUZZLE_SPEED * MORTAR_MUZZLE_SPEED),
    //   ) / 2

    const a = dist / MORTAR_FIRING_HEIGHT
    const b =
      (-MORTAR_GRAVITY * dist * dist) /
      (MORTAR_FIRING_HEIGHT * MORTAR_MUZZLE_SPEED * MORTAR_MUZZLE_SPEED)

    const qa = a * a + 1
    const qb = 2 * b * b - a * a
    const qc = b * b

    const disc = qb * qb - 4 * qa * qc
    if (disc < 0) {
      throw new Error('out of range 1')
    }
    const sqrtDisc = Math.sqrt(disc)

    const w1 = (-qb + sqrtDisc) / (2 * qa)
    const w2 = (-qb - sqrtDisc) / (2 * qa)

    let bestTheta: number | undefined
    for (const w of [w1, w2]) {
      if (w < 0) {
        continue
      }

      const sqw = Math.sqrt(w)
      if (Math.abs(sqw) > 1) {
        continue
      }

      const theta = Math.acos(sqw)
      if (bestTheta === undefined || bestTheta < theta) {
        bestTheta = theta
      }

      const otherTheta = Math.acos(-sqw)
      if (bestTheta < otherTheta) {
        bestTheta = otherTheta
      }
    }

    if (bestTheta === undefined) {
      throw new Error('out of range 2')
    }

    console.log(bestTheta)

    const hVel = MORTAR_MUZZLE_SPEED * Math.cos(bestTheta) // along origin-target axis
    const vVel = MORTAR_MUZZLE_SPEED * Math.sin(bestTheta) // along +Y3 axis
    bullet.vel = vec3.fromValues(
      (hVel * delta[0]) / dist,
      vVel,
      (hVel * delta[1]) / dist,
    )
  }

  return bullet
}

export function clone(b: Immutable<Bullet>): Bullet {
  return {
    origin: vec2.clone(b.origin),
    type: b.type,
    lifetime: b.lifetime,
    currentSpeed: b.currentSpeed,
    vel: b.vel !== undefined ? vec3.clone(b.vel) : undefined,
  }
}
