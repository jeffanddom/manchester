import { Entity } from '~/entities/Entity'
import { typeDefinitions } from '~/entities/types'
import { Game } from '~/Game'

export const update = (g: Game, frame: number): void => {
  const messages = g.serverMessageQueue
    .filter((m) => m.frame < frame)
    .sort((a, b) => a.frame - b.frame)

  messages.forEach((m) => {
    const nextFrameEntities: { [key: string]: Entity } = {}
    m.entities.forEach((serverEntity) => {
      let entity = g.clientEntityManager.entities[serverEntity.id]
      if (!entity) {
        entity = typeDefinitions[serverEntity.type!].make()
        entity.id = serverEntity.id
      }
      if (entity.transform) {
        entity.transform = {
          ...entity.transform,
          ...(serverEntity.transform || {}), // TODO: JSON will make this funky
        }
      }
      nextFrameEntities[entity.id] = entity
    })
    g.clientEntityManager.entities = nextFrameEntities
  })
}
