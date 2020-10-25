import { vec2 } from 'gl-matrix'

import { ITransform } from '~/components/transform'
import { TILE_SIZE } from '~/constants'
import { DirectionCollision } from '~/interfaces'
import { SimState } from '~/simulate'
import { aabbOverlap } from '~/util/math'
import { tileBox, tileCoords } from '~/util/tileMath'

export const update = (simState: Pick<SimState, 'entityManager'>): void => {
  for (const playerNumber in simState.entityManager.players) {
    const playerEntityId = simState.entityManager.players[playerNumber]
    const player = simState.entityManager.entities.get(playerEntityId)

    if (!player /* should not be necessary */ || !player.transform) {
      continue
    }

    const position = player.transform.position
    const checkAabb: [vec2, vec2] = [
      vec2.fromValues(position[0] - TILE_SIZE, position[1] - TILE_SIZE),
      vec2.fromValues(position[0] + TILE_SIZE, position[1] + TILE_SIZE),
    ]
    const queried = simState.entityManager.querySpatialIndex(checkAabb)
    const playerBox = tileBox(player.transform.position)
    const previousPlayerBox = tileBox(player.transform.previousPosition)

    let collisions: {
      direction: DirectionCollision
      transform: ITransform
      value: number
    }[] = []

    for (const index in queried) {
      const queriedId = queried[index]
      const other = simState.entityManager.entities.get(queriedId)
      if (
        !other || // query includes deleted entities (TODO: it shouldn't!)
        !other.wall || // query includes non-walls
        !other.transform
      ) {
        continue
      }

      const otherTransform = other.transform
      const wallBox = tileBox(otherTransform.position)

      if (aabbOverlap(playerBox, wallBox)) {
        // North
        if (
          previousPlayerBox[1][1] <= wallBox[0][1] &&
          playerBox[1][1] > wallBox[0][1]
        ) {
          collisions.push({
            transform: otherTransform,
            direction: DirectionCollision.North,
            value: wallBox[0][1],
          })
        }
        // South
        if (
          previousPlayerBox[0][1] >= wallBox[1][1] &&
          playerBox[0][1] < wallBox[1][1]
        ) {
          collisions.push({
            transform: otherTransform,
            direction: DirectionCollision.South,
            value: wallBox[1][1],
          })
        }
        // East
        if (
          previousPlayerBox[0][0] >= wallBox[1][0] &&
          playerBox[0][0] < wallBox[1][0]
        ) {
          collisions.push({
            transform: otherTransform,
            direction: DirectionCollision.East,
            value: wallBox[1][0],
          })
        }
        // West
        if (
          previousPlayerBox[1][0] <= wallBox[0][0] &&
          playerBox[1][0] > wallBox[0][0]
        ) {
          collisions.push({
            transform: otherTransform,
            direction: DirectionCollision.West,
            value: wallBox[0][0],
          })
        }
      }
    }

    collisions = collisions.filter((collision) => {
      const wallTransform = collision.transform
      const direction = collision.direction
      const coords = tileCoords(wallTransform.position)

      switch (direction) {
        case DirectionCollision.North:
          return (
            collisions.find((c) =>
              vec2.equals(
                tileCoords(c.transform.position),
                vec2.fromValues(coords[0], coords[1] - 1),
              ),
            ) === undefined
          )
        case DirectionCollision.South:
          return (
            collisions.find((c) =>
              vec2.equals(
                tileCoords(c.transform.position),
                vec2.fromValues(coords[0], coords[1] + 1),
              ),
            ) === undefined
          )
        case DirectionCollision.East:
          return (
            collisions.find((c) =>
              vec2.equals(
                tileCoords(c.transform.position),
                vec2.fromValues(coords[0] + 1, coords[1]),
              ),
            ) === undefined
          )
        case DirectionCollision.West:
          return (
            collisions.find((c) =>
              vec2.equals(
                tileCoords(c.transform.position),
                vec2.fromValues(coords[0] - 1, coords[1]),
              ),
            ) === undefined
          )
      }
    })

    if (collisions.length > 0) {
      simState.entityManager.checkpoint(player.id)

      // TypeScript issues a "possibly-undefined" error without this binding. Why?
      const transform = player.transform

      // Halt motion for collided edges
      collisions.forEach((collision) => {
        const direction = collision.direction
        const value = collision.value
        const offset = TILE_SIZE / 2 + 1 / 1000
        switch (direction) {
          case DirectionCollision.North:
            transform.position = vec2.fromValues(
              transform.position[0],
              value - offset,
            )
            break
          case DirectionCollision.South:
            transform.position = vec2.fromValues(
              transform.position[0],
              value + offset,
            )
            break
          case DirectionCollision.East:
            transform.position = vec2.fromValues(
              value + offset,
              transform.position[1],
            )
            break
          case DirectionCollision.West:
            transform.position = vec2.fromValues(
              value - offset,
              transform.position[1],
            )
            break
        }
      })
      player.transform = transform
    }
  }
}
