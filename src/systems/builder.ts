import { glMatrix, vec2 } from 'gl-matrix'

import { TILE_SIZE } from '~/constants'
import { make } from '~/entities/builder'
import { BuilderState } from '~/entities/builder/Builder'
import { PickupType } from '~/entities/pickup'
import { Team } from '~/entities/team'
import { makeTurret } from '~/entities/turret'
import { Game } from '~/Game'
import { pathfind } from '~/map/PathFinder'
import { MouseButton } from '~/Mouse'
import { tileCoords, tileToWorld } from '~/util/tileMath'

export const update = (g: Game, dt: number): void => {
  const playerTilePos = tileCoords(g.player!.transform!.position)

  // spawn builder
  const mousePos = g.mouse.getPos()
  if (g.mouse.isUp(MouseButton.RIGHT) && mousePos) {
    const destPos = g.camera.viewToWorldspace(mousePos)

    // Generate path to tile position
    const path = pathfind(g, playerTilePos, tileCoords(destPos))
    if (path) {
      const builder = make(destPos, g.player!.id, path)
      builder.transform!.position = vec2.clone(g.player!.transform!.position)
      g.entities.register(builder)
    }
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
      const inventory = g.player!.inventory!
      if (inventory.includes(PickupType.Core)) {
        inventory.splice(inventory.indexOf(PickupType.Core), 1)

        const turret = makeTurret()
        turret.team = Team.Friendly
        turret.transform!.position = tileToWorld(
          tileCoords(e.transform.position),
        )
        g.entities.register(turret)
      }

      e.builder.state = BuilderState.returnToHost
    }

    if (
      e.builder.state == BuilderState.returnToHost &&
      !vec2.equals(e.builder.target, g.player!.transform!.position)
    ) {
      e.builder.target = vec2.clone(g.player!.transform!.position)
      const newPath = pathfind(
        g,
        tileCoords(e.transform.position),
        tileCoords(e.builder.target),
      )
      // FIXME: this is a code smell; we should handle null better
      e.builder.path = newPath || []
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

  // TODO: fix me
  // g.debugDraw(() => {
  //   const renderables: Renderable[] = []
  //   for (const key in pathfinder.nodes) {
  //     const [x, y] = key
  //       .split(':')
  //       .map((v) => parseFloat(v) * TILE_SIZE + TILE_SIZE / 2)
  //     renderables.push({
  //       primitive: Primitive.CIRCLE,
  //       fillStyle: 'rgba(128,128,128,0.45)',
  //       pos: vec2.fromValues(x, y),
  //       radius: TILE_SIZE / 8,
  //     })
  //   }
  //   return renderables
  // })
}
