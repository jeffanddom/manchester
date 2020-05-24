import { IGenericComponent } from './interfaces'
import { IGame } from '~/interfaces'
import { IEntity } from '~/entities/interfaces'
import { vec2 } from 'gl-matrix'

export class PlayfieldClamper implements IGenericComponent {
  update(entity: IEntity, game: IGame): void {
    vec2.max(
      entity.transform.position,
      entity.transform.position,
      game.playfield.minWorldPos(),
    )
    vec2.min(
      entity.transform.position,
      entity.transform.position,
      game.playfield.maxWorldPos(),
    )
  }
}
