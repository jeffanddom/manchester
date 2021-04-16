import { vec2 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export enum BulletType {
  Standard,
  Rocket,
}
export const BULLET_TYPE_LENGTH = Object.values(BulletType).length / 2

export type Bullet = {
  origin: vec2
  lifetime: number
  type: BulletType

  currentSpeed?: number
}

export function make(origin: vec2, type: BulletType): Bullet {
  return {
    origin: vec2.clone(origin),
    lifetime: 0,
    type: type,
  }
}

export function clone(b: Immutable<Bullet>): Bullet {
  return {
    origin: vec2.clone(b.origin),
    type: b.type,
    lifetime: b.lifetime,
    currentSpeed: b.currentSpeed,
  }
}
