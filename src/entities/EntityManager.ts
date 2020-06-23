import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'
import { Renderable } from '~/renderer/interfaces'
import * as systems from '~/systems'

export class EntityManager {
  entities: { [key: string]: Entity }
  toDelete: string[]

  constructor() {
    this.entities = {}
    this.toDelete = []
  }

  // TODO: order by object type
  update(g: Game, dt: number): void {
    systems.transformInit(g)
    systems.motion(g, dt)
    systems.wallCollider(g)
    systems.shooter(g, dt)
    systems.damager(g)

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

  register(e: Entity): void {
    this.entities[e.id] = e
  }

  markForDeletion(id: string): void {
    this.toDelete.push(id)
  }
}
