import { Client } from '~/Client'
import { simulate } from '~/simulate'

export const update = (c: Client, dt: number, frame: number): void => {
  c.serverMessages = c.serverMessages
    .filter((m) => m.frame > c.serverFrame)
    .sort((a, b) => a.frame - b.frame)

  // Early-out if we haven't gotten server data to advance beyond our
  // authoritative snapshot.
  if (
    c.serverMessages.length === 0 ||
    c.serverMessages[0].frame !== c.serverFrame + 1
  ) {
    return
  }

  c.entityManager.restoreCheckpoints()

  c.serverMessages.forEach((frameMessage) => {
    simulate(
      {
        entityManager: c.entityManager,
        messages: frameMessage.inputs,
      },
      c.state,
      dt,
    )
    c.serverFrame = frameMessage.frame
  })

  c.entityManager.clearCheckpoint()

  // Re-application of prediction
  for (let f = c.serverFrame + 1; f <= frame; f++) {
    simulate(
      {
        entityManager: c.entityManager,
        messages: c.localMessageHistory.filter((m) => m.frame === f),
      },
      c.state,
      dt,
    )
  }
}
