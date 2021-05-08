import { vec2, vec3 } from 'gl-matrix'

import { MORTAR_GRAVITY, MORTAR_MUZZLE_SPEED } from '~/constants'
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

export function make(config: BulletConfig): Bullet | undefined {
  const bullet: Bullet = {
    origin: vec2.clone(config.origin),
    lifetime: 0,
    type: config.type,
  }

  if (config.type === BulletType.Mortar) {
    const delta = vec2.sub(vec2.create(), config.target, config.origin)
    const dist = vec2.length(delta)

    // See https://gamedev.stackexchange.com/a/53563
    const speedPow2 = MORTAR_MUZZLE_SPEED * MORTAR_MUZZLE_SPEED
    const speedPow4 = speedPow2 * speedPow2
    const discriminant =
      speedPow4 - MORTAR_GRAVITY * MORTAR_GRAVITY * dist * dist
    if (discriminant < 0) {
      return undefined
    }

    // There are usually two possible solutions, but we want the one that
    // produces the highest angle. Because atan() increases with its input, we
    // select the solution that adds the square root of the discriminant, and
    // discard the solution that subtracts.
    const theta = Math.atan2(
      speedPow2 + Math.sqrt(discriminant),
      -MORTAR_GRAVITY * dist,
    )

    const hVel = MORTAR_MUZZLE_SPEED * Math.cos(theta) // along origin-target axis
    const vVel = MORTAR_MUZZLE_SPEED * Math.sin(theta) // along +Y3 axis
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

// TODO: expand range check to all bullet types?
// Does this belong in the bullet system?
export function mortarInRange({
  target,
  origin,
}: {
  target: Immutable<vec2>
  origin: Immutable<vec2>
}): boolean {
  const delta = vec2.sub(vec2.create(), target, origin)
  const dist = vec2.length(delta)

  const speedPow2 = MORTAR_MUZZLE_SPEED * MORTAR_MUZZLE_SPEED
  const speedPow4 = speedPow2 * speedPow2
  const discriminant = speedPow4 - MORTAR_GRAVITY * MORTAR_GRAVITY * dist * dist
  if (discriminant < 0) {
    return false
  }
  return true
}
