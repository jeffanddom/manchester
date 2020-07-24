import { glMatrix, vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { make } from '~/entities/builder'
import { BuilderState } from '~/entities/builder/Builder'
import { Team } from '~/entities/team'
import { makeTurret } from '~/entities/turret'
import { Game } from '~/Game'
import { PathFinder } from '~/map/PathFinder'
import { MouseButton } from '~/Mouse'
import { Primitive, Renderable } from '~/renderer/interfaces'
import { tileCoords, tileToWorld } from '~/util/tileMath'

let pathfinder: PathFinder

export const update = (g: Game, dt: number): void => {
  if (pathfinder === undefined || pathfinder.map != g.map) {
    pathfinder = new PathFinder(g.map)
  }

  const playerTilePos = tileCoords(g.player.unwrap().transform!.position)

  // spawn builder
  if (g.mouse.isUp(MouseButton.RIGHT) && g.mouse.getPos().isSome()) {
    const destPos = g.camera.viewToWorldspace(g.mouse.getPos().unwrap())

    // Generate path to tile position
    const path = pathfinder.discover(playerTilePos, tileCoords(destPos))

    const builder = make(destPos, g.player.unwrap().id, path)
    builder.transform!.position = vec2.clone(
      g.player.unwrap().transform!.position,
    )
    g.entities.register(builder)
  }

  // destination system
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.builder || !e.transform) {
      continue
    }

    // If we're at a path point, remove the head of the path and
    // keep moving
    if (vec2.equals(e.transform.position, e.builder.path[0])) {
      e.builder.path.shift()
    }

    if (
      e.builder.state == BuilderState.leaveHost &&
      e.builder.path.length == 0
    ) {
      // create turret
      const turret = makeTurret({ path: [], fillStyle: '' })
      turret.team = Team.Friendly
      turret.transform!.position = tileToWorld(tileCoords(e.transform.position))
      g.entities.register(turret)

      e.builder.state = BuilderState.returnToHost
    }

    if (
      e.builder.state == BuilderState.returnToHost &&
      !vec2.equals(e.builder.target, g.player.unwrap().transform!.position)
    ) {
      e.builder.target = vec2.clone(g.player.unwrap().transform!.position)
      e.builder.path = pathfinder.discover(
        tileCoords(e.transform.position),
        tileCoords(e.builder.target),
      )
    }

    if (
      e.builder.state == BuilderState.returnToHost &&
      e.builder.path.length == 0
    ) {
      g.entities.markForDeletion(id)
      continue
    }

    const d = vec2.sub(vec2.create(), e.builder.path[0], e.transform.position)
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

  g.debugDraw(() => {
    const renderables: Renderable[] = []
    for (const key in pathfinder.nodes) {
      const [x, y] = key
        .split(':')
        .map((v) => parseFloat(v) * TILE_SIZE + TILE_SIZE / 2)
      renderables.push({
        primitive: Primitive.CIRCLE,
        fillStyle: 'rgba(128,128,128,0.45)',
        pos: vec2.fromValues(x, y),
        radius: TILE_SIZE / 8,
      })
    }
    return renderables
  })
}
