import { v4 } from 'uuid'
import { IGame } from '../interfaces'
import { IEntity, IEntityManager } from './interfaces'

export class EntityManager implements IEntityManager {
  entities: { [key: string]: IEntity }
  toDelete: string[]

  constructor() {
    this.entities = {}
    this.toDelete = []
  }

  // TODO: order by object type
  update(g: IGame) {
    Object.keys(this.entities).forEach((id) => {
      this.entities[id].update(g)
    })

    this.toDelete.forEach((id) => delete this.entities[id])
    this.toDelete = []
  }

  render(ctx: CanvasRenderingContext2D) {
    Object.keys(this.entities).forEach((id) => {
      this.entities[id].render(ctx)
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
