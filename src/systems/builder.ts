import { glMatrix, vec2 } from 'gl-matrix'

import { Team } from '~/components/team'
import { TILE_SIZE } from '~/constants'
import { make } from '~/entities/builder'
import { makeTurret } from '~/entities/turret'
import { Game } from '~/Game'
import { pathfind } from '~/map/PathFinder'
import { MouseButton } from '~/Mouse'
import { Primitive, Renderable } from '~/renderer/interfaces'
import { PickupType } from '~/systems/pickups'
import { RightClickMode } from '~/systems/playerInput'
import { tileCoords, tileToWorld } from '~/util/tileMath'

export enum BuilderMode {
  HARVEST,
  BUILD_TURRET,
  MOVE,
}

export enum BuilderState {
  leaveHost,
  returnToHost,
}

export class BuilderComponent {
  mode: BuilderMode
  state: BuilderState
  target: vec2
  host: string // Entity ID
  path: vec2[]

  constructor(params: {
    mode: BuilderMode
    target: vec2
    host: string
    path: vec2[]
  }) {
    this.mode = params.mode
    this.state = BuilderState.leaveHost
    this.target = params.target
    this.host = params.host
    this.path = params.path
  }
}

const debugPaths: { [key: string]: string[] } = {}

const maybeSpawn = (g: Game): void => {
  const mousePos = g.mouse.getPos()
  if (
    !g.mouse.isUp(MouseButton.RIGHT) ||
    !mousePos ||
    g.playerInputState.rightClickMode === RightClickMode.NONE
  ) {
    return
  }

  let mode
  switch (g.playerInputState.rightClickMode) {
    case RightClickMode.HARVEST:
      mode = BuilderMode.HARVEST
      break
    case RightClickMode.BUILD_TURRET:
      const inventory = g.player!.inventory!
      if (!inventory.includes(PickupType.Core)) {
        return
      }

      inventory.splice(inventory.indexOf(PickupType.Core), 1)
      mode = BuilderMode.BUILD_TURRET
      break
    case RightClickMode.MOVE_BUILDER:
      mode = BuilderMode.MOVE
      break
  }

  const destPos = g.camera.viewToWorldspace(mousePos)
  const playerTilePos = tileCoords(g.player!.transform!.position)
  const [path, nodes] = pathfind(g, playerTilePos, tileCoords(destPos))
  if (!path) {
    return
  }

  const params = {
    source: vec2.clone(g.player!.transform!.position),
    destination: destPos,
    host: g.player!.id,
    path: path,
  }

  const newBuilder = make({ ...params, mode })
  debugPaths[newBuilder.id] = nodes
  g.entities.register(newBuilder)
}

export const update = (g: Game, dt: number): void => {
  maybeSpawn(g)

  const existingBuilders: string[] = []

  // destination system
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.builder || !e.transform) {
      continue
    }

    // Used for tracking live builders in debugDraw
    existingBuilders.push(id)

    // If we're at a path point, remove the head of the path and
    // keep moving
    if (vec2.equals(e.transform.position, e.builder.path[0])) {
      e.builder.path.shift()
    }

    if (
      e.builder.state == BuilderState.leaveHost &&
      e.builder.path.length == 0
    ) {
      switch (e.builder.mode) {
        case BuilderMode.HARVEST:
          // TODO
          break

        case BuilderMode.BUILD_TURRET:
          delete e.dropType

          const turret = makeTurret()
          turret.team = Team.Friendly
          turret.transform!.position = tileToWorld(
            tileCoords(e.transform.position),
          )
          g.entities.register(turret)
          break

        case BuilderMode.MOVE:
          // do nothing
          break
      }

      e.builder.state = BuilderState.returnToHost
    }

    if (
      e.builder.state == BuilderState.returnToHost &&
      !vec2.equals(e.builder.target, g.player!.transform!.position)
    ) {
      e.builder.target = vec2.clone(g.player!.transform!.position)
      const [newPath, newNodes] = pathfind(
        g,
        tileCoords(e.transform.position),
        tileCoords(e.builder.target),
      )
      debugPaths[e.id] = newNodes

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

  g.debugDraw(() => {
    const renderables: Renderable[] = []
    for (const builderId in debugPaths) {
      if (!existingBuilders.includes(builderId)) {
        delete debugPaths[builderId]
        continue
      }

      const builderNodes = debugPaths[builderId]

      for (const key of builderNodes) {
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
    }

    return renderables
  })
}
