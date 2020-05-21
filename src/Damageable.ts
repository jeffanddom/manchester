import { IEntity, IDamageable } from './common'

export class Damageable implements IDamageable {
  health: number

  constructor(health) {
    this.health = health
  }

  update(entity: IEntity) {
    if (this.health <= 0) {
      entity.game.entities.markForDeletion(entity)
    }
  }
}
