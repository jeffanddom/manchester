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
import { PlayfieldClamper } from './components/PlayfieldClamper'

const PLAYER_SPEED = 60 * (TILE_SIZE / 4)
const PLAYER_ROT_SPEED = 1.25 * 2 * Math.PI // 1.5 rotations per second

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
  space: 32, // SPACE
}

export class PlayerMover {
  update(entity: IEntity, game: IGame, dt: number) {
    if (game.keyboard.downKeys.has(keyMap.up)) {
      radialTranslate2(
        entity.transform.position,
        entity.transform.position,
        entity.transform.orientation,
        PLAYER_SPEED * dt,
      )
    }

    if (game.keyboard.downKeys.has(keyMap.right)) {
      entity.transform.orientation += PLAYER_ROT_SPEED * dt
    }
    if (game.keyboard.downKeys.has(keyMap.left)) {
      entity.transform.orientation -= PLAYER_ROT_SPEED * dt
    }
  }
}

export const makePlayer = (): IEntity => {
  const e = new Entity()
  e.transform = new Transform()
  e.mover = new PlayerMover()
  e.shooter = new Shooter()
  e.wallCollider = new WallCollider()
  e.playfieldClamper = new PlayfieldClamper()
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
