import { glMatrix, vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { make } from '~/entities/pilot'
import { Game } from '~/Game'
import { PathFinder } from '~/map/PathFinder'
import { MouseButton } from '~/Mouse'

export const update = (g: Game, dt: number): void => {
  // spawn pilot
  if (g.mouse.isUp(MouseButton.RIGHT) && g.mouse.getPos().isSome()) {
    const destPos = g.camera.viewToWorldspace(g.mouse.getPos().unwrap())

    // Find tile positions of pilot and destination
    const playerTilePos = vec2.floor(
      vec2.create(),
      vec2.scale(
        vec2.create(),
        g.player.unwrap().transform!.position,
        1 / TILE_SIZE,
      ),
    )
    const tilePos = vec2.floor(
      vec2.create(),
      vec2.scale(vec2.create(), destPos, 1 / TILE_SIZE),
    )

    // Generate path to tile position
    const pathfinder = new PathFinder(g.map)
    const path = pathfinder.discover(playerTilePos, tilePos)

    const pilot = make(destPos, path)
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

    // If we're at a path point, remove the head of the path and
    // keep moving
    if (vec2.equals(e.transform.position, e.destination.path[0])) {
      e.destination.path.shift()
    }

    // Remove destination and continue once we've reached the end of a path
    if (e.destination.path.length == 0) {
      e.destination = undefined
      continue
    }

    const d = vec2.sub(
      vec2.create(),
      e.destination.path[0],
      e.transform.position,
    )
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
