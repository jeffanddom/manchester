import { FrameState } from '~/editor/updateSystems'

export const updateCursorSystem = (frameState: FrameState): void => {
  // const currentPlayer = frameState.stateDb.currentPlayer

  frameState.messages.forEach((m) => {
    if (m.cursorUpdate === undefined) {
      return
    }

    for (const [id, playerNumber] of frameState.stateDb.cursors) {
      if (m.playerNumber === playerNumber) {
        frameState.stateDb.gridPos.update(id, {
          x: Math.floor(m.cursorUpdate.x),
          y: Math.floor(m.cursorUpdate.y),
        })
      }
    }
  })
}
