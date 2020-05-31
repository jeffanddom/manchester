import { v4 } from 'uuid'

import { IGame } from '~/interfaces'
import { IEntity, IEntityManager } from '~/entities/interfaces'
import { Camera } from '~/Camera'
import { render } from '~/renderable'

export class EntityManager implements IEntityManager {
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

  render(ctx: CanvasRenderingContext2D, camera: Camera) {
    const wvTransform = camera.wvTransform()
    for (let id in this.entities) {
      const e = this.entities[id]
      if (e.renderable === undefined) {
        continue
      }
      render(ctx, e.renderable.getRenderable(e), wvTransform)
    }
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
