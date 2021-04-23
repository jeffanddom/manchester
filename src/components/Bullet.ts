import { vec2 } from 'gl-matrix'

import { MORTAR_TTL } from '~/constants'
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

  currentSpeed?: number
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
    const dist = vec2.dist(config.origin, config.target)
    bullet.currentSpeed = dist / MORTAR_TTL
  }

  return bullet
}

export function clone(b: Immutable<Bullet>): Bullet {
  return {
    origin: vec2.clone(b.origin),
    type: b.type,
    lifetime: b.lifetime,
    currentSpeed: b.currentSpeed,
  }
}
