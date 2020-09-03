import * as _ from 'lodash'

import { Client } from '~/Client'
import { SIMULATION_PERIOD_S } from '~/constants'
import { Entity } from '~/entities/Entity'
import * as systems from '~/systems'

export const update = (c: Client, dt: number, frame: number): void => {
  c.serverMessages = c.serverMessages
    .filter((m) => m.frame <= c.serverSnapshot.frame)
    .sort((a, b) => a.frame - b.frame)

  // Early-out if we haven't gotten server data to advance beyond our
  // authoritative snapshot.
  if (
    c.serverMessages.length === 0 ||
    c.serverMessages[0].frame !== c.serverSnapshot.frame + 1
  ) {
    return
  }

  c.serverMessages.forEach((frameMessage) => {
    const nextFrameEntities: { [key: string]: Entity } = {}

    systems.tankMover(
      {
        entityManager: c.entityManager,
        messages: frameMessage.inputs,
      },
      dt,
      frame,
    )

    c.serverSnapshot = {
      frame: frameMessage.frame,
      entities: nextFrameEntities,
    }
  })

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
