import { IEntity } from '../interfaces'
import { IGame } from '../../interfaces'
import { IDamageable } from './interfaces'

export class Damageable implements IDamageable {
  health: number

  constructor(health: number) {
    this.health = health
  }

  update(entity: IEntity, game: IGame) {
    if (this.health <= 0) {
      game.entities.markForDeletion(entity)
    }
  }
}
