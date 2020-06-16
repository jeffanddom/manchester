import { vec2 } from 'gl-matrix'

import { IGenericComponent } from '~/entities/components/interfaces'
import { Entity } from '~/entities/Entity'
import { Game } from '~/Game'

export class PlayfieldClamper implements IGenericComponent {
  update(entity: Entity, game: Game): void {
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
