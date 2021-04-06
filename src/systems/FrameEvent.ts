import { vec2 } from 'gl-matrix'

import { EntityId } from '~/entities/EntityId'

export enum FrameEventType {
  BulletHit,
  EntityDestroyed,
  TankShoot,
  TankHit,
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

export interface TankShootEvent {
  type: FrameEventType.TankShoot
  entityId: EntityId
  orientation: number
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
  | TankShootEvent
  | TankHitEvent
  | TurretShootEvent
