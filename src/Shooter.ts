import { IEntity } from './common'
import { Bullet } from './Bullet'

const keyMap = {
  fire: 32, // fire
}

export class Shooter {
  lastFiredAt: number

  constructor() {
    this.lastFiredAt = -1
  }

  update(entity: IEntity) {
    if (entity.game.keyboard.downKeys.has(keyMap.fire)) {
      if (Date.now() - this.lastFiredAt > 150) {
        entity.game.entities.register(
          new Bullet(entity.transform.position, entity.transform.orientation),
        )
        this.lastFiredAt = Date.now()
      }
    }
  }
}
