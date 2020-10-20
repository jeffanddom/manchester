import { vec2 } from 'gl-matrix'
import * as _ from 'lodash'

import { Type } from './types'

import { Entity } from '~/entities/Entity'
import { Renderable } from '~/renderer/interfaces'
import { Quadtree } from '~/util/quadtree'
import { minBiasAabbOverlap } from '~/util/quadtree/helpers'
import { tileBox } from '~/util/tileMath'

type QuadtreeEntity = {
  id: string
  aabb: [vec2, vec2]
}

export class EntityManager {
  nextEntityId: number
  entities: { [key: string]: Entity } // array of structures -> structure of arrays

  toDelete: string[]
  checkpointedEntities: { [key: string]: Entity }
  uncommitted: Set<string>
  players: string[]

  // To include: walls, trees, turrets
  quadtree: Quadtree<QuadtreeEntity>

  constructor(playfieldAabb: [vec2, vec2]) {
    this.nextEntityId = 0
    this.entities = {}
    this.toDelete = []
    this.checkpointedEntities = {}
    this.uncommitted = new Set()
    this.players = []

    this.quadtree = new Quadtree<QuadtreeEntity>({
      maxItems: 4,
      aabb: playfieldAabb,
      comparator: (aabb: [vec2, vec2], e: QuadtreeEntity) => {
        return minBiasAabbOverlap(aabb, e.aabb)
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
    this.uncommitted.forEach((u) => this.commitToSpatialIndex(u))
    for (const maybeDeletedId in Object.keys(this.checkpointedEntities)) {
      if (this.entities[maybeDeletedId] === undefined) {
        this.removeFromSpatialIndex(this.checkpointedEntities[maybeDeletedId])
      }
    }

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
    return this.entities[this.players[playerNumber]]
  }

  register(e: Entity): void {
    e.id = this.nextEntityId.toString()
    this.nextEntityId++
    this.entities[e.id] = e
    this.uncommitted.add(e.id)

    if (e.type && e.type === Type.PLAYER) {
      this.players[e.playerNumber!] = e.id
    }
  }

  markForDeletion(id: string): void {
    this.checkpoint(id)
    this.toDelete.push(id)
  }

  // Broadphase Collision Detection
  // add
  //   if it's committed, put in quadtree
  //   if it's predicted, put in prediction bucket
  // remove
  //   remove committed from quadtree
  //   keep track of upcoming deletions as prediction

  query(aabb: [vec2, vec2]): string[] {
    // Return known tile-aligned entities
    const quadtreeResults = this.quadtree.query(aabb).map((r) => r.id)

    // Add all players
    quadtreeResults.push(...Object.values(this.players))

    return quadtreeResults.sort()
  }

  commitToSpatialIndex(id: string): void {
    const e = this.entities[id]
    if (!e || !e.transform) {
      return
    }

    const entityAabb = tileBox(e.transform.position)

    if (e.type && [Type.TREE, Type.TURRET, Type.WALL].includes(e.type)) {
      this.quadtree.insert({ aabb: entityAabb, id: e.id })
    }
  }

  removeFromSpatialIndex(e: Entity): void {
    this.quadtree.remove(e.id)
  }
}
