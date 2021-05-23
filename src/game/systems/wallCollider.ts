import { vec2 } from 'gl-matrix'

import { FrameState } from '~/apps/game/simulate'
import { Transform } from '~/game/components/Transform'
import { TILE_SIZE } from '~/game/constants'
import { Immutable } from '~/types/immutable'
import * as aabb2 from '~/util/aabb2'
import { Aabb2 } from '~/util/aabb2'
import { tileBox, tileCoords } from '~/util/tileMath'

enum DirectionCollision {
  North = 'N',
  South = 'S',
  East = 'E',
  West = 'W',
}

export const update = (frameState: FrameState): void => {
  for (const [id] of frameState.stateDb.playerNumbers) {
    const transform = frameState.stateDb.transforms.get(id)!
    const position = transform.position
    const checkAabb: Aabb2 = [
      position[0] - TILE_SIZE,
      position[1] - TILE_SIZE,
      position[0] + TILE_SIZE,
      position[1] + TILE_SIZE,
    ]
    const queried = frameState.stateDb.queryByWorldPos(checkAabb)
    const playerBox = tileBox(position)
    const previousPlayerBox = tileBox(transform.previousPosition)

    let collisions: {
      direction: DirectionCollision
      transform: Immutable<Transform>
      value: number
    }[] = []

    for (const index in queried) {
      const queriedId = queried[index]
      if (!frameState.stateDb.walls.has(queriedId)) {
        continue
      }

      const otherTransform = frameState.stateDb.transforms.get(queriedId)!
      const wallBox = tileBox(otherTransform.position)

      if (aabb2.overlap(playerBox, wallBox)) {
        // North
        if (
          previousPlayerBox[aabb2.Elem.y2] <= wallBox[aabb2.Elem.y1] &&
          playerBox[aabb2.Elem.y2] > wallBox[aabb2.Elem.y1]
        ) {
          collisions.push({
            transform: otherTransform,
            direction: DirectionCollision.North,
            value: wallBox[aabb2.Elem.y1],
          })
        }
        // South
        if (
          previousPlayerBox[aabb2.Elem.y1] >= wallBox[aabb2.Elem.y2] &&
          playerBox[aabb2.Elem.y1] < wallBox[aabb2.Elem.y2]
        ) {
          collisions.push({
            transform: otherTransform,
            direction: DirectionCollision.South,
            value: wallBox[aabb2.Elem.y2],
          })
        }
        // East
        if (
          previousPlayerBox[aabb2.Elem.x1] >= wallBox[aabb2.Elem.x2] &&
          playerBox[aabb2.Elem.x1] < wallBox[aabb2.Elem.x2]
        ) {
          collisions.push({
            transform: otherTransform,
            direction: DirectionCollision.East,
            value: wallBox[aabb2.Elem.x2],
          })
        }
        // West
        if (
          previousPlayerBox[aabb2.Elem.x2] <= wallBox[aabb2.Elem.x1] &&
          playerBox[aabb2.Elem.x2] > wallBox[aabb2.Elem.x1]
        ) {
          collisions.push({
            transform: otherTransform,
            direction: DirectionCollision.West,
            value: wallBox[aabb2.Elem.x1],
          })
        }
      }
    }

    collisions = collisions.filter((collision) => {
      const wallTransform = collision.transform
      const direction = collision.direction
      const coords = tileCoords(vec2.create(), wallTransform.position)
      const preallocVec2 = vec2.create()

      switch (direction) {
        case DirectionCollision.North:
          return (
            collisions.find((c) =>
              vec2.equals(
                tileCoords(preallocVec2, c.transform.position),
                vec2.fromValues(coords[0], coords[1] - 1),
              ),
            ) === undefined
          )
        case DirectionCollision.South:
          return (
            collisions.find((c) =>
              vec2.equals(
                tileCoords(preallocVec2, c.transform.position),
                vec2.fromValues(coords[0], coords[1] + 1),
              ),
            ) === undefined
          )
        case DirectionCollision.East:
          return (
            collisions.find((c) =>
              vec2.equals(
                tileCoords(preallocVec2, c.transform.position),
                vec2.fromValues(coords[0] + 1, coords[1]),
              ),
            ) === undefined
          )
        case DirectionCollision.West:
          return (
            collisions.find((c) =>
              vec2.equals(
                tileCoords(preallocVec2, c.transform.position),
                vec2.fromValues(coords[0] - 1, coords[1]),
              ),
            ) === undefined
          )
      }
    })

    if (collisions.length > 0) {
      // Halt motion for collided edges
      collisions.forEach((collision) => {
        const direction = collision.direction
        const value = collision.value
        const offset = TILE_SIZE / 2 + 1 / 1000
        switch (direction) {
          case DirectionCollision.North:
            frameState.stateDb.transforms.update(id, {
              position: vec2.fromValues(transform.position[0], value - offset),
            })
            break
          case DirectionCollision.South:
            frameState.stateDb.transforms.update(id, {
              position: vec2.fromValues(transform.position[0], value + offset),
            })
            break
          case DirectionCollision.East:
            frameState.stateDb.transforms.update(id, {
              position: vec2.fromValues(value + offset, transform.position[1]),
            })
            break
          case DirectionCollision.West:
            frameState.stateDb.transforms.update(id, {
              position: vec2.fromValues(value - offset, transform.position[1]),
            })
            break
        }
      })
    }
  }
}
