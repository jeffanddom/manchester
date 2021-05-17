import { EntityId } from '~/sim/EntityId'

export interface EntityStateContainer {
  has: (id: EntityId) => boolean
  delete: (id: EntityId) => boolean
  commit: () => void
  rollback: () => void
}
