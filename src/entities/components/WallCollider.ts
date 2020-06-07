import { Direction, IGame } from '~/interfaces'
import { TILE_SIZE } from '~/constants'
import { tileBox, tileCoords } from '~util/tileMath'
import { vec2 } from 'gl-matrix'
import { IEntity } from '~/entities/interfaces'
import { IWallCollider } from '~/entities/components/interfaces'

export class WallCollider implements IWallCollider {
  hitLastFrame: boolean
  collidedWalls: IEntity[]

  constructor() {
    this.hitLastFrame = false
  }

  update(entity: IEntity, game: IGame) {
    this.collidedWalls = []

    // Get all walls colliding with this entity
    const myBox = tileBox(entity.transform.position)
    const previousBox = tileBox(entity.transform.previousPosition)
    let collided: [IEntity, Direction, number][] = []
    for (let id in game.entities.entities) {
      const other = game.entities.entities[id]
      if (other.wall === undefined) {
        continue
      }

      const wallBox = tileBox(other.transform.position)

      if (
        myBox[0][0] < wallBox[1][0] &&
        myBox[1][0] > wallBox[0][0] &&
        myBox[0][1] < wallBox[1][1] &&
        myBox[1][1] > wallBox[0][1]
      ) {
        // North
        if (previousBox[1][1] < wallBox[0][1] && myBox[1][1] > wallBox[0][1]) {
          collided.push([other, Direction.North, wallBox[0][1]])
        }
        // South
        if (previousBox[0][1] > wallBox[1][1] && myBox[0][1] < wallBox[1][1]) {
          collided.push([other, Direction.South, wallBox[1][1]])
        }
        // East
        if (previousBox[0][0] > wallBox[1][0] && myBox[0][0] < wallBox[1][0]) {
          collided.push([other, Direction.East, wallBox[1][0]])
        }
        // West
        if (previousBox[1][0] < wallBox[0][0] && myBox[1][0] > wallBox[0][0]) {
          collided.push([other, Direction.West, wallBox[0][0]])
        }
      }
    }

    collided = collided.filter((collision) => {
      const wall = collision[0]
      const direction = collision[1]
      const coords = tileCoords(wall.transform.position)

      switch (direction) {
        case Direction.North:
          return (
            collided.find((c) =>
              vec2.equals(
                tileCoords(c[0].transform.position),
                vec2.fromValues(coords[0], coords[1] - 1),
              ),
            ) === undefined
          )
        case Direction.South:
          return (
            collided.find((c) =>
              vec2.equals(
                tileCoords(c[0].transform.position),
                vec2.fromValues(coords[0], coords[1] + 1),
              ),
            ) === undefined
          )
        case Direction.East:
          return (
            collided.find((c) =>
              vec2.equals(
                tileCoords(c[0].transform.position),
                vec2.fromValues(coords[0] + 1, coords[1]),
              ),
            ) === undefined
          )
        case Direction.West:
          return (
            collided.find((c) =>
              vec2.equals(
                tileCoords(c[0].transform.position),
                vec2.fromValues(coords[0] - 1, coords[1]),
              ),
            ) === undefined
          )
      }
    })

    // Track walls that were collided with
    this.collidedWalls = collided.map((c) => c[0])

    // Halt motion for collided edges
    collided.forEach((collision) => {
      const direction = collision[1]
      const value = collision[2]
      const offset = TILE_SIZE / 2 + 1 / 1000
      switch (direction) {
        case Direction.North:
          entity.transform.position = vec2.fromValues(
            entity.transform.position[0],
            value - offset,
          )
          break
        case Direction.South:
          entity.transform.position = vec2.fromValues(
            entity.transform.position[0],
            value + offset,
          )
          break
        case Direction.East:
          entity.transform.position = vec2.fromValues(
            value + offset,
            entity.transform.position[1],
          )
          break
        case Direction.West:
          entity.transform.position = vec2.fromValues(
            value - offset,
            entity.transform.position[1],
          )
          break
      }
    })

    this.hitLastFrame = collided.length > 0
  }
}
