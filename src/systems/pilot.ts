import { glMatrix, vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { make } from '~/entities/pilot'
import { Game } from '~/Game'
import { MouseButton } from '~/Mouse'

export const update = (g: Game, dt: number): void => {
  // spawn pilot
  if (g.mouse.isUp(MouseButton.RIGHT) && g.mouse.getPos().isSome()) {
    const destPos = g.camera.viewToWorldspace(g.mouse.getPos().unwrap())
    const pilot = make(destPos)
    pilot.transform!.position = vec2.clone(
      g.player.unwrap().transform!.position,
    )
    g.entities.register(pilot)
  }

  // destination system
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.destination || !e.transform) {
      continue
    }

    const d = vec2.sub(vec2.create(), e.destination.pos, e.transform.position)
    const dlen = vec2.len(d)
    if (glMatrix.equals(dlen, 0)) {
      continue
    }

    const frameSpeed = 60 * (TILE_SIZE / 7.5)
    const disp = vec2.scale(
      vec2.create(),
      vec2.normalize(vec2.create(), d),
      Math.min(dt * frameSpeed, dlen),
    )

    vec2.add(e.transform.position, e.transform.position, disp)
  }
}
