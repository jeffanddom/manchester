import { FrameState } from '~/editor/updateSystems'

export const updateTileEditSystem = (frameState: FrameState): void => {
  // const currentPlayer = frameState.stateDb.currentPlayer

  frameState.messages.forEach((m) => {
    if (m.tileUpdate === undefined) {
      return
    }

    const tileId = frameState.stateDb.getTileByGridPos(
      m.tileUpdate.x,
      m.tileUpdate.y,
    )
    if (tileId === undefined) {
      frameState.stateDb.registerEntity({
        gridPos: { x: m.tileUpdate.x, y: m.tileUpdate.y },
        tile: { type: m.tileUpdate.type },
        model: 'tile',
      })
    } else {
      frameState.stateDb.tiles.update(tileId, { type: m.tileUpdate.type })
    }
  })
}
