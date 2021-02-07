import { /* glMatrix, */ vec2 } from 'gl-matrix'

// import { Team } from '~/components/team'
// import { TILE_SIZE } from '~/constants'
// import { make } from '~/entities/builder'
// import { Entity } from '~/entities/Entity'
import { EntityId } from '~/entities/EntityId'
import { EntityManager } from '~/entities/EntityManager'
// import { makeTurret } from '~/entities/turret'
// import { makeWall } from '~/entities/wall'
// import { pathfind } from '~/map/PathFinder'
// import { PickupType } from '~/systems/pickups'
// import { tileCoords, tileToWorld } from '~/util/tileMath'

export enum BuilderMode {
  HARVEST,
  BUILD_TURRET,
  BUILD_WALL,
  MOVE,
}

export enum BuilderState {
  leaveHost,
  returnToHost,
}

export class BuilderCreator {
  nextBuilder:
    | {
        mode: BuilderMode
        dest: vec2
      }
    | undefined

  constructor() {
    this.nextBuilder = undefined
  }
}

export class BuilderComponent {
  mode: BuilderMode
  state: BuilderState
  target: vec2
  host: EntityId
  path: vec2[]

  constructor(params: {
    mode: BuilderMode
    target: vec2
    host: EntityId
    path: vec2[]
  }) {
    this.mode = params.mode
    this.state = BuilderState.leaveHost
    this.target = params.target
    this.host = params.host
    this.path = params.path
  }
}

export const update = (entityManager: EntityManager, dt: number): void => {
  spawnBuilders(entityManager)
  updateBuilders(entityManager, dt)
}

const spawnBuilders = (_entityManager: EntityManager): void => {
  // for (const [id, e] of entityManager.entities) {
  //   if (!e.transform || !e.builderCreator || !e.builderCreator.nextBuilder) {
  //     continue
  //   }
  //   const playerTilePos = tileCoords(e.transform.position)
  //   const [path, nodes] = pathfind(
  //     entityManager,
  //     playerTilePos,
  //     tileCoords(e.builderCreator.nextBuilder.dest),
  //   )
  //   if (!path) {
  //     continue
  //   }
  //   const params = {
  //     source: vec2.clone(e.transform!.position),
  //     destination: e.builderCreator.nextBuilder.dest,
  //     host: id,
  //     path: path,
  //   }
  //   const newBuilder = make({
  //     ...params,
  //     mode: e.builderCreator.nextBuilder.mode,
  //   })
  //   debugPaths[newBuilder.id] = nodes
  //   entityManager.register(newBuilder)
  // }
}

// const debugPaths: { [key: string]: string[] } = {}

const updateBuilders = (_entityManager: EntityManager, _dt: number): void => {
  // const existingBuilders: string[] = []
  // // destination system
  // for (const [id, e] of entityManager.entities) {
  //   if (!e.builder || !e.transform) {
  //     continue
  //   }
  //   // Used for tracking live builders in debugDraw
  //   existingBuilders.push(id)
  //   // If we're at a path point, remove the head of the path and
  //   // keep moving
  //   if (vec2.equals(e.transform.position, e.builder.path[0])) {
  //     e.builder.path.shift()
  //   }
  //   if (
  //     e.builder.state == BuilderState.leaveHost &&
  //     e.builder.path.length == 0
  //   ) {
  //     const ourTilePos = tileCoords(e.transform!.position)
  //     switch (e.builder.mode) {
  //       case BuilderMode.HARVEST:
  //         const harvestable = Object.values(entityManager.entities).find(
  //           (other: Entity) => {
  //             if (!other.harvestType || !other.transform) {
  //               return false
  //             }
  //             const otherTilePos = tileCoords(other.transform!.position)
  //             return vec2.equals(ourTilePos, otherTilePos)
  //           },
  //         )
  //         if (harvestable) {
  //           entityManager.markForDeletion(harvestable.id)
  //           e.dropType = PickupType.Wood
  //         }
  //         break
  //       case BuilderMode.BUILD_TURRET:
  //         delete e.dropType
  //         const turret = makeTurret()
  //         turret.team = Team.Friendly
  //         turret.transform!.position = tileToWorld(ourTilePos)
  //         entityManager.register(turret)
  //         break
  //       case BuilderMode.BUILD_WALL:
  //         delete e.dropType
  //         const wall = makeWall()
  //         wall.transform!.position = tileToWorld(ourTilePos)
  //         entityManager.register(wall)
  //         break
  //       case BuilderMode.MOVE:
  //         // do nothing
  //         break
  //     }
  //     e.builder.state = BuilderState.returnToHost
  //   }
  //   const host = entityManager.entities.get(e.builder.host)!
  //   if (
  //     e.builder.state == BuilderState.returnToHost &&
  //     !vec2.equals(e.builder.target, host.transform!.position)
  //   ) {
  //     e.builder.target = vec2.clone(host.transform!.position)
  //     const [newPath, newNodes] = pathfind(
  //       entityManager,
  //       tileCoords(e.transform.position),
  //       tileCoords(e.builder.target),
  //     )
  //     debugPaths[e.id] = newNodes
  //     // FIXME: this is a code smell; we should handle null better
  //     e.builder.path = newPath || []
  //   }
  //   if (
  //     e.builder.state == BuilderState.returnToHost &&
  //     e.builder.path.length == 0
  //   ) {
  //     if (e.dropType) {
  //       host.inventory!.push(e.dropType)
  //     }
  //     entityManager.markForDeletion(id)
  //     continue
  //   }
  //   const d = vec2.sub(vec2.create(), e.builder.path[0], e.transform.position)
  //   const dlen = vec2.len(d)
  //   if (glMatrix.equals(dlen, 0)) {
  //     continue
  //   }
  //   const frameSpeed = 60 * (TILE_SIZE / 7.5)
  //   const disp = vec2.scale(
  //     vec2.create(),
  //     vec2.normalize(vec2.create(), d),
  //     Math.min(dt * frameSpeed, dlen),
  //   )
  //   vec2.add(e.transform.position, e.transform.position, disp)
  // }
  // g.debugDraw(() => {
  //   const renderables: Renderable[] = []
  //   for (const builderId in debugPaths) {
  //     if (!existingBuilders.includes(builderId)) {
  //       delete debugPaths[builderId]
  //       continue
  //     }
  //     const builderNodes = debugPaths[builderId]
  //     for (const key of builderNodes) {
  //       const [x, y] = key
  //         .split(':')
  //         .map((v) => parseFloat(v) * TILE_SIZE + TILE_SIZE / 2)
  //       renderables.push({
  //         primitive: Primitive.CIRCLE,
  //         fillStyle: 'rgba(128,128,128,0.45)',
  //         pos: vec2.fromValues(x, y),
  //         radius: TILE_SIZE / 8,
  //       })
  //     }
  //   }
  //   return renderables
  // })
}
