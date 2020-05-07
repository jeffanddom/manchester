import { v4 } from 'uuid'

export interface Entity {
  id?: number
  manager?: EntityManager

  update: () => void
  render: (ctx: CanvasRenderingContext2D) => void
}

export class EntityManager {
  entities: { [key: string]: Entity }
  toDelete: string[]

  constructor() {
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
      entity.manager = null
    })
    this.toDelete = []
  }

  render(ctx: CanvasRenderingContext2D) {
    Object.keys(this.entities).forEach((id) => {
      this.entities[id].render(ctx)
    })
  }

  register(e: Entity) {
    const id = v4()
    e.id = id
    e.manager = this
    this.entities[id] = e
  }

  markForDeletion(entity) {
    this.toDelete.push(entity.id)
  }
}
