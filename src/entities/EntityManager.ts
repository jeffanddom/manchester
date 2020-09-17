import { Entity } from '~/entities/Entity'
import { Renderable } from '~/renderer/interfaces'

export class EntityManager {
  nextEntityId: number
  entities: { [key: string]: Entity }
  toDelete: string[]

  constructor() {
    this.nextEntityId = 0
    this.entities = {}
    this.toDelete = []
  }

  update(): void {
    this.toDelete.forEach((id) => delete this.entities[id])
    this.toDelete = []
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
    e.id = this.nextEntityId
    this.nextEntityId++
    this.entities[e.id] = e
  }

  markForDeletion(id: string): void {
    this.toDelete.push(id)
  }
}
