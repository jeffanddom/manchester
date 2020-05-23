import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { path2 } from '~/path2'
import { Transform } from '~/entities/components/Transform'
import { Shooter } from '~/entities/components/Shooter'
import { WallCollider } from '~/entities/components/WallCollider'
import { PathRenderable } from '~/entities/components/PathRenderable'
import { IGame } from '~/interfaces'
import { radialTranslate2 } from '~/mathutil'
import { IEntity } from '~/entities/interfaces'

const PLAYER_SPEED = TILE_SIZE / 16

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
  space: 32, // SPACE
}

export class PlayerMover {
  update(entity: IEntity, game: IGame) {
    if (game.keyboard.downKeys.has(keyMap.up)) {
      radialTranslate2(
        entity.transform.position,
        entity.transform.position,
        entity.transform.orientation,
        PLAYER_SPEED,
      )
    }

    if (game.keyboard.downKeys.has(keyMap.right)) {
      entity.transform.orientation += 0.1
    }
    if (game.keyboard.downKeys.has(keyMap.left)) {
      entity.transform.orientation -= 0.1
    }
  }
}

export const makePlayer = (): IEntity => {
  const e = new Entity()
  e.transform = new Transform()
  e.mover = new PlayerMover()
  e.shooter = new Shooter()
  e.wallCollider = new WallCollider()
  e.pathRenderable = new PathRenderable(
    path2.fromValues([
      [0, -TILE_SIZE * 0.5],
      [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
      [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
    ]),
    '#000000',
  )

  return e
}
