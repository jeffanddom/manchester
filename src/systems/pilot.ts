import { glMatrix, vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { make } from '~/entities/pilot'
import { PilotState } from '~/entities/pilot/Pilot'
import { Game } from '~/Game'
import { PathFinder } from '~/map/PathFinder'
import { MouseButton } from '~/Mouse'
import { tileCoords } from '~/util/tileMath'

export const update = (g: Game, dt: number): void => {
  const pathfinder = new PathFinder(g.map)
  const playerTilePos = tileCoords(g.player.unwrap().transform!.position)

  // spawn pilot
  if (g.mouse.isUp(MouseButton.RIGHT) && g.mouse.getPos().isSome()) {
    const destPos = g.camera.viewToWorldspace(g.mouse.getPos().unwrap())

    // Generate path to tile position
    const path = pathfinder.discover(playerTilePos, tileCoords(destPos))

    const pilot = make(destPos, g.player.unwrap().id, path)
    pilot.transform!.position = vec2.clone(
      g.player.unwrap().transform!.position,
    )
    g.entities.register(pilot)
  }

  // destination system
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.pilot || !e.transform) {
      continue
    }

    // If we're at a path point, remove the head of the path and
    // keep moving
    if (vec2.equals(e.transform.position, e.pilot.path[0])) {
      e.pilot.path.shift()
    }

    if (e.pilot.state == PilotState.leaveHost && e.pilot.path.length == 0) {
      e.pilot.state = PilotState.returnToHost
    }

    if (
      e.pilot.state == PilotState.returnToHost &&
      !vec2.equals(e.pilot.target, g.player.unwrap().transform!.position)
    ) {
      e.pilot.target = vec2.clone(g.player.unwrap().transform!.position)
      e.pilot.path = pathfinder.discover(
        tileCoords(e.transform.position),
        tileCoords(e.pilot.target),
      )
    }

    if (e.pilot.state == PilotState.returnToHost && e.pilot.path.length == 0) {
      g.entities.markForDeletion(id)
      continue
    }

    const d = vec2.sub(vec2.create(), e.pilot.path[0], e.transform.position)
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
