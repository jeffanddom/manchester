import { vec2 } from 'gl-matrix'

import { IGenericComponent } from './interfaces'

import { IEntity } from '~/entities/interfaces'
import { IGame } from '~/interfaces'

export class PlayfieldClamper implements IGenericComponent {
  update(entity: IEntity, game: IGame): void {
    vec2.max(
      entity.transform!.position,
      entity.transform!.position,
      game.terrain.minWorldPos(),
    )
    vec2.min(
      entity.transform!.position,
      entity.transform!.position,
      game.terrain.maxWorldPos(),
    )
  }
}
