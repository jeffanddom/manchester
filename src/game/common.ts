import { vec2 } from 'gl-matrix'

import { Map } from '~/engine/map/interfaces'
import { StateDb } from '~/engine/sim/StateDb'
import * as terrain from '~/engine/terrain'
import { CommonAssets } from '~/game/assets/CommonAssets'
import { TILE_SIZE } from '~/game/constants'
import * as entities from '~/game/entities'
import { Type } from '~/game/entities/types'

export const gameProgression = [
  CommonAssets.maps.get('bigMap')!,
  CommonAssets.maps.get('quadtreeTest')!,
  CommonAssets.maps.get('collisionTest')!,
]

export const initMap = (stateDb: StateDb, map: Map): terrain.Layer => {
  // Level setup
  const terrainLayer = new terrain.Layer({
    tileOrigin: map.origin,
    tileDimensions: map.dimensions,
    terrain: map.terrain,
  })

  // Populate entities
  let playerCounter = 0
  for (let i = 0; i < map.dimensions[1]; i++) {
    for (let j = 0; j < map.dimensions[0]; j++) {
      const et = map.entities[i * map.dimensions[0] + j]
      if (et === null) {
        continue
      }

      const entity = entities.types.make(et)
      if (et === Type.PLAYER) {
        playerCounter++
        entity.playerNumber = playerCounter
      }

      if (entity.transform !== undefined) {
        entity.transform.position = vec2.add(
          vec2.create(),
          terrainLayer.minWorldPos(),
          vec2.fromValues(
            j * TILE_SIZE + TILE_SIZE * 0.5,
            i * TILE_SIZE + TILE_SIZE * 0.5,
          ),
        )
      }

      stateDb.register(entity)
    }
  }

  stateDb.commitPrediction()

  return terrainLayer
}
