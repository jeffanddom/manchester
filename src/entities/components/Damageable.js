export class Damageable {
    constructor(health) {
        this.health = health;
    }
    update(entity, game) {
        if (this.health <= 0) {
            game.entities.markForDeletion(entity);
        }
    }
}
