import * as _ from 'lodash'

import { Entity } from '~/entities/Entity'
import { Renderable } from '~/renderer/interfaces'

export class EntityManager {
  nextEntityId: number
  entities: { [key: string]: Entity } // array of structures -> structure of arrays

  toDelete: string[]
  checkpointedEntities: { [key: string]: Entity }
  uncommitted: Set<string>

  constructor() {
    this.nextEntityId = 0
    this.entities = {}
    this.toDelete = []
    this.checkpointedEntities = {}
    this.uncommitted = new Set()
  }

  update(): void {
    this.toDelete.forEach((id) => delete this.entities[id])
    this.toDelete = []
  }

  checkpoint(id: string): void {
    if (this.checkpointedEntities[id]) {
      return
    }
    this.checkpointedEntities[id] = _.cloneDeep(this.entities[id])
  }

  restoreCheckpoints(): void {
    for (const id of Object.keys(this.checkpointedEntities)) {
      this.entities[id] = this.checkpointedEntities[id]
    }

    this.nextEntityId -= this.uncommitted.size
    this.uncommitted.forEach((id) => delete this.entities[id])

    this.uncommitted = new Set()
    this.checkpointedEntities = {}
  }

  clearCheckpoint(): void {
    this.uncommitted = new Set()
    this.checkpointedEntities = {}
  }

  getRenderables(): Renderable[] {
    const renderables: Renderable[] = []
    for (const id in this.entities) {
      const e = this.entities[id]
      if (e.renderable === undefined) {
        continue
      }
      renderables.push(...e.renderable.getRenderables(e))
    }
    return renderables
  }

  getPlayer(playerNumber: number): Entity | null {
    return (
      Object.values(this.entities).find(
        (e) => e.playerNumber === playerNumber,
      ) || null
    )
  }

  register(e: Entity): void {
    e.id = this.nextEntityId.toString()
    this.nextEntityId++
    this.entities[e.id] = e
    this.uncommitted.add(e.id)
  }

  markForDeletion(id: string): void {
    this.checkpoint(id)
    this.toDelete.push(id)
  }
}
