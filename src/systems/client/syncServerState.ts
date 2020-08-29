import * as _ from 'lodash'

import { SIMULATION_PERIOD_S } from '~/constants'
import { Entity } from '~/entities/Entity'
import { typeDefinitions } from '~/entities/types'
import { Game } from '~/Game'
import * as systems from '~/systems'

export const update = (g: Game, frame: number): void => {
  // compile authoritative state from server messages
  const messages = g.client.serverMessages.sort((a, b) => a.frame - b.frame)

  messages.forEach((m) => {
    const nextFrameEntities: { [key: string]: Entity } = {}
    m.entities.forEach((serverEntity) => {
      let entity = g.client.serverSnapshot.entities[serverEntity.id]
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

    g.client.serverSnapshot = {
      frame: m.frame,
      entities: nextFrameEntities,
    }
  })

  g.client.serverMessages = []

  // Run input reconciliation
  g.client.entityManager.entities = _.cloneDeep(
    g.client.serverSnapshot.entities,
  )

  for (let f = g.client.serverSnapshot.frame + 1; f <= frame; f++) {
    const frameMessages = g.client.messageBuffer.filter((m) => m.frame === f)
    systems.tankMover(
      { entityManager: g.client.entityManager, messages: frameMessages },
      SIMULATION_PERIOD_S,
      f,
    )
  }
}
