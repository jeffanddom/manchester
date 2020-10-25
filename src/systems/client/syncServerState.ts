import { Client } from '~/Client'
import { simulate } from '~/simulate'

export const update = (c: Client, dt: number, frame: number): void => {
  c.serverFrameUpdates = c.serverFrameUpdates
    .filter((m) => m.frame > c.committedFrame)
    .sort((a, b) => a.frame - b.frame)

  // Early-out if we haven't gotten server data to advance beyond our
  // authoritative snapshot.
  if (
    c.serverFrameUpdates.length === 0 ||
    c.serverFrameUpdates[0].frame !== c.committedFrame + 1
  ) {
    return
  }

  c.entityManager.undoPrediction()

  c.serverFrameUpdates.forEach((frameMessage) => {
    simulate(
      {
        entityManager: c.entityManager,
        messages: frameMessage.inputs,
        terrainLayer: c.terrainLayer,
        registerParticleEmitter: c.registerParticleEmitter,
      },
      c.state,
      dt,
    )
    c.committedFrame = frameMessage.frame
  })

  c.entityManager.commitPrediction()

  c.localMessageHistory = c.localMessageHistory.filter(
    (m) => m.frame > c.committedFrame,
  )

  // Re-application of prediction
  // !! Linear slowdown dependent on the # of frames ahead of the server
  for (let f = c.committedFrame + 1; f <= frame; f++) {
    simulate(
      {
        entityManager: c.entityManager,
        messages: c.localMessageHistory.filter((m) => m.frame === f),
        terrainLayer: c.terrainLayer,
        registerParticleEmitter: c.registerParticleEmitter,
      },
      c.state,
      dt,
    )
  }
}
