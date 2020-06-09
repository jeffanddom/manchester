import { TILE_SIZE } from '~/constants'
import { IGame } from '~/interfaces'
import { IEntity } from '~/entities/interfaces'
import { radialTranslate2, lerp } from '~util/math'
import { vec2 } from 'gl-matrix'
import { Rotator } from '~entities/components/Rotator'

const PLAYER_SPEED = 60 * (TILE_SIZE / 8)
const PLAYER_ROT_SPEED = Math.PI

const keyMap = {
  moveUp: 87,
  moveDown: 83,
  moveLeft: 68,
  moveRight: 65,
}

export class Mover {
  rotator: Rotator

  constructor() {
    this.rotator = new Rotator({ speed: PLAYER_ROT_SPEED })
  }

  update(entity: IEntity, game: IGame, dt: number) {
    // Direction controls
    let angle

    if (game.keyboard.downKeys.has(keyMap.moveUp)) {
      if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
        angle = Math.PI / 4
      } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
        angle = -Math.PI / 4
      } else {
        angle = 0
      }
    } else if (game.keyboard.downKeys.has(keyMap.moveDown)) {
      if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
        angle = Math.PI - Math.PI / 4
      } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
        angle = Math.PI + Math.PI / 4
      } else {
        angle = Math.PI
      }
    } else if (game.keyboard.downKeys.has(keyMap.moveLeft)) {
      angle = Math.PI / 2
    } else if (game.keyboard.downKeys.has(keyMap.moveRight)) {
      angle = -Math.PI / 2
    }

    if (angle !== undefined) {
      // FIXME: model off of the turret turning behavior
      entity.transform!.orientation = this.rotator.rotate({
        from: entity.transform!,
        to: angle,
        dt,
      })

      radialTranslate2(
        entity.transform!.position,
        entity.transform!.position,
        angle,
        PLAYER_SPEED * dt,
      )
    }
  }
}
