import * as _ from 'lodash'

import { Client } from '~/Client'
import { SIMULATION_PERIOD_S } from '~/constants'
import { Entity } from '~/entities/Entity'
import { typeDefinitions } from '~/entities/types'
import * as systems from '~/systems'

export const update = (c: Client, frame: number): void => {
  // compile authoritative state from server messages
  const messages = c.serverMessages.sort((a, b) => a.frame - b.frame)

  messages.forEach((m) => {
    const nextFrameEntities: { [key: string]: Entity } = {}
    m.entities.forEach((serverEntity) => {
      let entity = c.serverSnapshot.entities[serverEntity.id]
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

    c.serverSnapshot = {
      frame: m.frame,
      entities: nextFrameEntities,
    }
  })

  c.serverMessages = []

  // Run input reconciliation
  c.entityManager.entities = _.cloneDeep(c.serverSnapshot.entities)

  for (let f = c.serverSnapshot.frame + 1; f <= frame; f++) {
    const frameMessages = c.messageBuffer.filter((m) => m.frame === f)
    systems.tankMover(
      { entityManager: c.entityManager, messages: frameMessages },
      SIMULATION_PERIOD_S,
      f,
    )
  }
}
