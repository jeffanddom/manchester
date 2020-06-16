import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Renderable } from '~/renderer/interfaces'

export class EntityManager {
  entities: { [key: string]: Entity }
  toDelete: string[]

  constructor() {
    this.entities = {}
    this.toDelete = []
  }

  // TODO: order by object type
  update(g: Game, dt: number) {
    Object.keys(this.entities).forEach((id) => {
      this.entities[id].update(g, dt)
    })

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

  register(e: Entity) {
    this.entities[e.id] = e
  }

  markForDeletion(entity: Entity) {
    this.toDelete.push(entity.id)
  }
}
