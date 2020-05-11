import { v4 } from 'uuid'
import { IEntityManager, IGame, IEntity } from './common'

export class EntityManager implements IEntityManager {
  game: IGame
  entities: { [key: string]: IEntity }
  toDelete: string[]

  constructor(game: IGame) {
    this.game = game
    this.entities = {}
    this.toDelete = []
  }

  // TODO: order by object type
  update() {
    Object.keys(this.entities).forEach((id) => {
      this.entities[id].update()
    })

    this.toDelete.forEach((id) => {
      const entity = this.entities[id]
      delete this.entities[id]
      entity.id = null
      entity.game = null
    })
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
    e.game = this.game
    this.entities[id] = e
  }

  markForDeletion(entity: IEntity) {
    this.toDelete.push(entity.id)
  }

  // getEntitiesAtTilePos(pos: [number, number]): IEntity[] {

  //   const res = []
  //   this.entities.forEach(e => {
  //     if ()
  //   })
  //   return res
  // }
}
