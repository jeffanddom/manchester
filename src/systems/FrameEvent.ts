import { EntityId } from '~/entities/EntityId'

export enum FrameEventType {
  TankShoot,
  TankHit,
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

export type FrameEvent = TankShootEvent | TankHitEvent
