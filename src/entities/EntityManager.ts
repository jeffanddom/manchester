import { vec2 } from 'gl-matrix'
import * as _ from 'lodash'

import { Type } from './types'

import { Entity } from '~/entities/Entity'
import { EntityId, castToEntityId } from '~/entities/EntityId'
import { Renderable } from '~/renderer/interfaces'
import { Quadtree } from '~/util/quadtree'
import { minBiasAabbOverlap } from '~/util/quadtree/helpers'
import { tileBox } from '~/util/tileMath'

type QuadtreeEntity = {
  id: EntityId
  aabb: [vec2, vec2]
}

export class EntityManager {
  nextEntityId: number
  entities: Map<EntityId, Entity> // array of structures -> structure of arrays

  toDelete: Set<EntityId>
  checkpointedEntities: Map<EntityId, Entity>
  predictedRegistrations: Set<EntityId>
  predictedDeletes: Set<EntityId>
  players: EntityId[]

  // To include: walls, trees, turrets
  quadtree: Quadtree<QuadtreeEntity>

  constructor(playfieldAabb: [vec2, vec2]) {
    this.nextEntityId = 0
    this.entities = new Map()
    this.toDelete = new Set()
    this.checkpointedEntities = new Map()
    this.predictedRegistrations = new Set()
    this.predictedDeletes = new Set()
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
    this.toDelete.forEach((id) => {
      this.predictedDeletes.add(id)
      this.entities.delete(id)
    })
    this.toDelete = new Set()

    // TODO: clean up this.players
  }

  checkpoint(id: EntityId): void {
    if (this.checkpointedEntities.has(id)) {
      return
    }
    this.checkpointedEntities.set(id, _.cloneDeep(this.entities.get(id)!))
  }

  restoreCheckpoints(): void {
    for (const [id, entity] of this.checkpointedEntities) {
      this.entities.set(id, entity)
    }
    this.predictedDeletes = new Set()
    this.checkpointedEntities = new Map()

    this.predictedRegistrations.forEach((id) => this.entities.delete(id))
    this.nextEntityId -= this.predictedRegistrations.size
    this.predictedRegistrations = new Set()
  }

  commitState(): void {
    this.predictedRegistrations.forEach((id) => this.commitToSpatialIndex(id))
    this.predictedRegistrations = new Set()

    this.predictedDeletes.forEach((id) => this.removeFromSpatialIndex(id))
    this.predictedDeletes = new Set()

    this.checkpointedEntities = new Map()
  }

  getRenderables(aabb: [vec2, vec2]): Renderable[] {
    const renderables: Renderable[] = []
    for (const id of this.query(aabb)) {
      const e = this.entities.get(id)
      if (!e /* TODO: we shouldn't need this */ || !e.renderable) {
        continue
      }
      renderables.push(...e.renderable.getRenderables(e))
    }
    return renderables
  }

  getPlayer(playerNumber: number): Entity | undefined {
    return this.entities.get(this.players[playerNumber])
  }

  register(e: Entity): void {
    e.id = castToEntityId(this.nextEntityId.toString())
    this.nextEntityId++
    this.entities.set(e.id, e)
    this.predictedRegistrations.add(e.id)

    if (e.type && e.type === Type.PLAYER) {
      this.players[e.playerNumber!] = e.id
    }
  }

  markForDeletion(id: EntityId): void {
    this.checkpoint(id)
    this.toDelete.add(id)
  }

  // Broadphase Collision Detection
  // add
  //   if it's committed, put in quadtree
  //   if it's predicted, put in prediction bucket
  // remove
  //   remove committed from quadtree
  //   keep track of upcoming deletions as prediction

  query(aabb: [vec2, vec2]): EntityId[] {
    // Start with known non-moving entities
    const results = new Set<EntityId>(
      this.quadtree.query(aabb).map((r) => r.id),
    )

    // Add all known moving entities
    // TODO - for now, it's just players
    for (const id of this.players) {
      results.add(id)
    }

    // TODO: maybe add predicted registrations

    // Remove predicted deletions
    for (const id of this.predictedDeletes) {
      results.delete(id)
    }

    return Array.from(results).sort()
  }

  commitToSpatialIndex(id: EntityId): void {
    const e = this.entities.get(id)
    if (!e || !e.transform) {
      return
    }

    const entityAabb = tileBox(e.transform.position)

    if (e.type && [Type.TREE, Type.TURRET, Type.WALL].includes(e.type)) {
      this.quadtree.insert({ aabb: entityAabb, id: e.id })
    }
  }

  removeFromSpatialIndex(id: string): void {
    this.quadtree.remove(id)
  }
}
