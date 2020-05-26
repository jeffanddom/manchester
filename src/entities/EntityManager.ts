import { v4 } from 'uuid'

import { IGame } from '~/interfaces'
import { IEntity, IEntityManager } from '~/entities/interfaces'
import { Camera } from '~/Camera'

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
    Object.keys(this.entities).forEach((id) => {
      this.entities[id].render(ctx, camera)
    })
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
