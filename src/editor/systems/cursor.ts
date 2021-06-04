import { FrameState } from '~/editor/updateSystems'

export const updateCursorSystem = (frameState: FrameState): void => {
  // const currentPlayer = frameState.stateDb.currentPlayer

  frameState.messages.forEach((m) => {
    if (m.cursor === undefined) {
      return
    }

    for (const [id, playerNumber] of frameState.stateDb.cursors) {
      if (m.playerNumber === playerNumber) {
        frameState.stateDb.gridPos.set(id, {
          x: Math.floor(m.cursor.x),
          y: Math.floor(m.cursor.y),
        })
      }
    }
  })
}
