import { IGame } from '~/interfaces'
import { IEntity } from '~/entities/interfaces'
import { IDamageable } from '~/entities/components/interfaces'

export class Damageable implements IDamageable {
  health: number

  constructor(health: number) {
    this.health = health
  }

  update(entity: IEntity, game: IGame, _dt: number) {
    if (this.health <= 0) {
      game.entities.markForDeletion(entity)
    }
  }
}
