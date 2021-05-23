import { EntityId } from '~/engine/state/EntityId'

export interface EntityStateContainer {
  has: (id: EntityId) => boolean
  delete: (id: EntityId) => boolean
  commit: () => void
  rollback: () => void
}
