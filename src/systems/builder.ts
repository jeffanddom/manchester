import { vec2 } from 'gl-matrix'

import { BUILDER_SPEED } from '~/constants'
// import { Team } from '~/components/team'
// import { TILE_SIZE } from '~/constants'
// import { make } from '~/entities/builder'
// import { Entity } from '~/entities/Entity'
import { FrameState } from '~/simulate'
// import { makeTurret } from '~/entities/turret'
// import { makeWall } from '~/entities/wall'
// import { pathfind } from '~/map/PathFinder'
// import { PickupType } from '~/systems/pickups'
import { tileCoords, tileToWorld } from '~/util/tileMath'

// export enum BuilderMode {
//   HARVEST,
//   BUILD_TURRET,
//   BUILD_WALL,
//   MOVE,
// }

// export enum BuilderState {
//   leaveHost,
//   returnToHost,
// }

// export class BuilderCreator {
//   nextBuilder:
//     | {
//         mode: BuilderMode
//         dest: vec2
//       }
//     | undefined

//   constructor() {
//     this.nextBuilder = undefined
//   }
// }

export interface Builder {
  target: vec2
}

export const clone = (builder: Builder): Builder => {
  return {
    target: vec2.clone(builder.target),
  }
}

const tilePos = vec2.create()
const destTilePos = vec2.create()
const nextTilePos = vec2.create()

export const update = (simState: FrameState, dt: number): void => {
  for (const [id, builder] of simState.simState.builders) {
    const pos = simState.simState.transforms.get(id)!.position
    tileCoords(tilePos, pos)
    tileCoords(destTilePos, builder.target)

    const path: number[] = []

    // prettier-ignore
    simState.simState.routePlanner.search(
      tilePos[0] + 32, tilePos[1] + 32,
      destTilePos[0] + 32, destTilePos[1] + 32,
      path
    )

    if (path.length > 2) {
      vec2.set(nextTilePos, path[2] - 32, path[3] - 32)
      tileToWorld(nextTilePos, nextTilePos)

      // Aim for the next path element and step by dt
      const move = vec2.create()
      vec2.subtract(move, nextTilePos, pos)
      vec2.normalize(move, move)
      vec2.scale(move, move, dt * BUILDER_SPEED)
      vec2.add(move, pos, move)

      simState.simState.transforms.update(id, {
        position: move,
      })
    } else {
      // console.log('kill builder')
      // kill bill-der
    }
  }
}
