import { IMotionScript } from '~/entities/components/interfaces'
import { Transform } from '~/entities/components/Transform'
import { Game } from '~/Game'
import { getAngle } from '~/util/math'
import { rotate } from '~/util/rotator'

const TURRET_ROT_SPEED = Math.PI / 2

export class MotionScript implements IMotionScript {
  update(transform: Transform, _entityId: string, g: Game, dt: number): void {
    transform.orientation = rotate({
      from: transform.orientation,
      to: getAngle(transform.position, g.player.unwrap().transform!.position),
      amount: TURRET_ROT_SPEED * dt,
    })
  }
}
