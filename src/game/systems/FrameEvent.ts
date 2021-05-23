import { vec2 } from 'gl-matrix'

import { EntityId } from '~/engine/state/EntityId'
import { BulletType } from '~/game/components/Bullet'

export enum FrameEventType {
  BulletHit,
  EntityDestroyed,
  MortarExplosion,
  TankHit,
  TankShoot,
  TurretShoot,
}

export interface BulletHitEvent {
  type: FrameEventType.BulletHit
  position: vec2
}

export interface EntityDestroyed {
  type: FrameEventType.EntityDestroyed
  position: vec2
}

export interface Explosion {
  type: FrameEventType.MortarExplosion
  position: vec2
}

export interface TankShootEvent {
  type: FrameEventType.TankShoot
  entityId: EntityId
  orientation: number
  bulletType: BulletType
}

export interface TankHitEvent {
  type: FrameEventType.TankHit
  entityId: EntityId
  hitAngle: number
}

export interface TurretShootEvent {
  type: FrameEventType.TurretShoot
  position: vec2
  orientation: number
}

export type FrameEvent =
  | BulletHitEvent
  | EntityDestroyed
  | Explosion
  | TankShootEvent
  | TankHitEvent
  | TurretShootEvent
