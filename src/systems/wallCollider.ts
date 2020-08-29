import { vec2 } from 'gl-matrix'

import { ITransform } from '~/components/transform'
import { TILE_SIZE } from '~/constants'
import { Game } from '~/Game'
import { DirectionCollision } from '~/interfaces'
import { tileBox, tileCoords } from '~/util/tileMath'

export const update = (g: Game): void => {
  for (const id in g.server.entityManager.entities) {
    const e = g.server.entityManager.entities[id]
    if (!e.transform || !e.wallCollider) {
      continue
    }

    // Get all walls colliding with this entity
    const myBox = tileBox(e.transform.position)
    const previousBox = tileBox(e.transform.previousPosition)
    let collided: [ITransform, DirectionCollision, number][] = []
    for (const id in g.server.entityManager.entities) {
      const other = g.server.entityManager.entities[id]
      if (!other.wall || !other.transform) {
        continue
      }
      const otherTransform = other.transform
      const wallBox = tileBox(otherTransform.position)

      if (
        myBox[0][0] < wallBox[1][0] &&
        myBox[1][0] > wallBox[0][0] &&
        myBox[0][1] < wallBox[1][1] &&
        myBox[1][1] > wallBox[0][1]
      ) {
        // North
        if (previousBox[1][1] < wallBox[0][1] && myBox[1][1] > wallBox[0][1]) {
          collided.push([
            otherTransform,
            DirectionCollision.North,
            wallBox[0][1],
          ])
        }
        // South
        if (previousBox[0][1] > wallBox[1][1] && myBox[0][1] < wallBox[1][1]) {
          collided.push([
            otherTransform,
            DirectionCollision.South,
            wallBox[1][1],
          ])
        }
        // East
        if (previousBox[0][0] > wallBox[1][0] && myBox[0][0] < wallBox[1][0]) {
          collided.push([
            otherTransform,
            DirectionCollision.East,
            wallBox[1][0],
          ])
        }
        // West
        if (previousBox[1][0] < wallBox[0][0] && myBox[1][0] > wallBox[0][0]) {
          collided.push([
            otherTransform,
            DirectionCollision.West,
            wallBox[0][0],
          ])
        }
      }
    }

    collided = collided.filter((collision) => {
      const wallTransform = collision[0]
      const direction = collision[1]
      const coords = tileCoords(wallTransform.position)

      switch (direction) {
        case DirectionCollision.North:
          return (
            collided.find((c) =>
              vec2.equals(
                tileCoords(c[0].position),
                vec2.fromValues(coords[0], coords[1] - 1),
              ),
            ) === undefined
          )
        case DirectionCollision.South:
          return (
            collided.find((c) =>
              vec2.equals(
                tileCoords(c[0].position),
                vec2.fromValues(coords[0], coords[1] + 1),
              ),
            ) === undefined
          )
        case DirectionCollision.East:
          return (
            collided.find((c) =>
              vec2.equals(
                tileCoords(c[0].position),
                vec2.fromValues(coords[0] + 1, coords[1]),
              ),
            ) === undefined
          )
        case DirectionCollision.West:
          return (
            collided.find((c) =>
              vec2.equals(
                tileCoords(c[0].position),
                vec2.fromValues(coords[0] - 1, coords[1]),
              ),
            ) === undefined
          )
      }
    })

    // TypeScript issues a "possibly-undefined" error without this binding. Why?
    const transform = e.transform

    // Halt motion for collided edges
    collided.forEach((collision) => {
      const direction = collision[1]
      const value = collision[2]
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
  }
}
