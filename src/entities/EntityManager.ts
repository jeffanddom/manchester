import { v4 } from 'uuid'

import { IGame } from '~/interfaces'
import { IEntity } from '~/entities/interfaces'
import { Renderable } from '~renderer/interfaces'

export class EntityManager {
  entities: { [key: string]: IEntity }
  toDelete: string[]

  constructor() {
    this.entities = {}
    this.toDelete = []
  }

  // TODO: order by object type
  update(g: IGame, dt: number) {
    Object.keys(this.entities).forEach((id) => {
      this.entities[id].update(g, dt)
    })

    this.toDelete.forEach((id) => delete this.entities[id])
    this.toDelete = []
  }

  getRenderables(): Renderable[] {
    const renderables: Renderable[] = []
    for (let id in this.entities) {
      const e = this.entities[id]
      if (e.renderable === undefined) {
        continue
      }
      renderables.push(e.renderable.getRenderable(e))
    }
    return renderables
  }

  register(e: IEntity) {
    const id = v4()
    e.id = id
    this.entities[id] = e
  }

  markForDeletion(entity: IEntity) {
    this.toDelete.push(entity.id)
  }
}
