import { vec2 } from 'gl-matrix'
import * as _ from 'lodash'

import { Type } from './types'

import { Entity } from '~/entities/Entity'
import { Renderable } from '~/renderer/interfaces'
import { Quadtree } from '~/util/quadtree'
import { minBiasAabbOverlap } from '~/util/quadtree/helpers'
import { tileBox } from '~/util/tileMath'

export class EntityManager {
  nextEntityId: number
  entities: { [key: string]: Entity } // array of structures -> structure of arrays

  toDelete: string[]
  checkpointedEntities: { [key: string]: Entity }
  uncommitted: Set<string>

  // To include: walls, trees, turrets
  quadtree: Quadtree<string>

  constructor(playfieldAabb: [vec2, vec2]) {
    this.nextEntityId = 0
    this.entities = {}
    this.toDelete = []
    this.checkpointedEntities = {}
    this.uncommitted = new Set()

    this.quadtree = new Quadtree<string>({
      maxItems: 4,
      aabb: playfieldAabb,
      comparator: (aabb: [vec2, vec2], entityId: string) => {
        const entity = this.entities[entityId]
        if (!entity || !entity.transform) {
          return false
        }

        const entityAabb = tileBox(entity.transform.position)
        return minBiasAabbOverlap(aabb, entityAabb)
      },
    })
  }

  update(): void {
    this.toDelete.forEach((id) => delete this.entities[id])
    this.toDelete = []
  }

  checkpoint(id: string): void {
    if (this.checkpointedEntities[id]) {
      return
    }
    this.checkpointedEntities[id] = _.cloneDeep(this.entities[id])
  }

  restoreCheckpoints(): void {
    for (const id of Object.keys(this.checkpointedEntities)) {
      this.entities[id] = this.checkpointedEntities[id]
    }

    this.nextEntityId -= this.uncommitted.size
    this.uncommitted.forEach((id) => delete this.entities[id])

    this.uncommitted = new Set()
    this.checkpointedEntities = {}
  }

  clearCheckpoint(): void {
    this.uncommitted = new Set()
    this.checkpointedEntities = {}
  }

  getRenderables(): Renderable[] {
    const renderables: Renderable[] = []
    for (const id in this.entities) {
      const e = this.entities[id]
      if (e.renderable === undefined) {
        continue
      }
      renderables.push(...e.renderable.getRenderables(e))
    }
    return renderables
  }

  getPlayer(playerNumber: number): Entity | null {
    return (
      Object.values(this.entities).find(
        (e) => e.playerNumber === playerNumber,
      ) || null
    )
  }

  register(e: Entity): void {
    e.id = this.nextEntityId.toString()
    this.nextEntityId++
    this.entities[e.id] = e
    this.uncommitted.add(e.id)

    // Add to quadtree
    // FIXME: if these items are added during a prediction phase (i.e. a player
    // builds a wall) entities will be added to the quadtree multiple times
    if (e.type && [Type.TREE, Type.TURRET, Type.WALL].includes(e.type)) {
      console.log('\n\n----> NEW ENTITY', e.id)
      console.log(tileBox(e.transform!.position))
      this.quadtree.insert(e.id)
    }
  }

  markForDeletion(id: string): void {
    this.checkpoint(id)
    this.toDelete.push(id)
  }
}
