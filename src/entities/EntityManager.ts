import { vec2 } from 'gl-matrix'
import * as _ from 'lodash'

import { Type } from './types'

import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { ITransform } from '~/components/transform'
import { Entity } from '~/entities/Entity'
import { EntityId } from '~/entities/EntityId'
import { Renderable } from '~/renderer/interfaces'
import { Quadtree } from '~/util/quadtree'
import { minBiasAabbOverlap } from '~/util/quadtree/helpers'
import { SortedMap } from '~/util/SortedMap'
import { SortedSet } from '~/util/SortedSet'
import { tileBox } from '~/util/tileMath'

type QuadtreeEntity = {
  id: EntityId
  aabb: [vec2, vec2]
}

export class EntityManager {
  private nextEntityId: number
  entities: Map<EntityId, Entity> // TODO: make this private
  private toDelete: Set<EntityId>
  private checkpointedEntities: Map<EntityId, Entity>
  private predictedRegistrations: Set<EntityId>
  private predictedDeletes: Set<EntityId>

  // TODO: make these private
  transforms: SortedMap<EntityId, ITransform>
  players: SortedMap<EntityId, number>
  moveables: SortedSet<EntityId>
  bullets: SortedSet<EntityId>
  damagers: SortedMap<EntityId, Damager>
  damageables: SortedMap<EntityId, Damageable>
  playfieldClamped: SortedSet<EntityId>

  // To include: walls, trees, turrets
  private quadtree: Quadtree<EntityId, QuadtreeEntity>

  constructor(playfieldAabb: [vec2, vec2]) {
    this.nextEntityId = 0
    this.entities = new Map()
    this.toDelete = new Set()
    this.checkpointedEntities = new Map()
    this.predictedRegistrations = new Set()
    this.predictedDeletes = new Set()

    this.transforms = new SortedMap()
    this.players = new SortedMap()
    this.moveables = new SortedSet()
    this.bullets = new SortedSet()
    this.damagers = new SortedMap()
    this.damageables = new SortedMap()
    this.playfieldClamped = new SortedSet()

    this.quadtree = new Quadtree<EntityId, QuadtreeEntity>({
      maxItems: 4,
      aabb: playfieldAabb,
      comparator: (aabb: [vec2, vec2], e: QuadtreeEntity) => {
        return minBiasAabbOverlap(aabb, e.aabb)
      },
    })
  }

  public update(): void {
    for (const id of this.toDelete) {
      this.unindexEntity(id)
      this.predictedDeletes.add(id)
    }
    this.toDelete = new Set()
  }

  /**
   * Before modifying entity state, we need to to checkpoint it. Internally,
   * this will snapshot the entity state before any updates occur. The snapshot
   * allows us to restore the state of the entity if we need to rewind changes
   * due to predicted simulation.
   */
  public checkpoint(id: EntityId): void {
    if (this.checkpointedEntities.has(id)) {
      return
    }
    this.checkpointedEntities.set(id, _.cloneDeep(this.entities.get(id)!))
  }

  public undoPrediction(): void {
    for (const [, entity] of this.checkpointedEntities) {
      this.indexEntity(entity)
    }
    this.checkpointedEntities = new Map()
    this.predictedDeletes = new Set()

    this.predictedRegistrations.forEach((id) => this.unindexEntity(id))
    this.nextEntityId -= this.predictedRegistrations.size
    this.predictedRegistrations = new Set()
  }

  public commitPrediction(): void {
    this.predictedRegistrations = new Set()
    this.predictedDeletes = new Set()
    this.checkpointedEntities = new Map()
  }

  public getRenderables(aabb: [vec2, vec2]): Renderable[] {
    const renderables: Renderable[] = []
    for (const id of this.queryByWorldPos(aabb)) {
      const e = this.entities.get(id)
      if (!e /* TODO: we shouldn't need this */ || !e.renderable) {
        continue
      }
      renderables.push(...e.renderable.getRenderables(e))
    }
    return renderables
  }

  public getPlayer(playerNumber: number): Entity | undefined {
    for (const [id, n] of this.players) {
      if (n === playerNumber) {
        return this.entities.get(id)
      }
    }

    return undefined
  }

  public register(e: Entity): void {
    e.id = this.nextEntityId.toString() as EntityId
    this.nextEntityId++
    this.predictedRegistrations.add(e.id)

    this.indexEntity(e)
  }

  public markForDeletion(id: EntityId): void {
    this.checkpoint(id)
    this.toDelete.add(id)
  }

  private indexEntity(e: Entity): void {
    this.entities.set(e.id, e)

    if (e.transform) {
      this.transforms.set(e.id, e.transform)
    }

    if (e.type && e.type === Type.PLAYER) {
      this.players.set(e.id, e.playerNumber!)
    }

    if (e.moveable) {
      this.moveables.add(e.id)
    }

    if (e.bullet) {
      this.bullets.add(e.id)
    }

    if (e.damager) {
      this.damagers.set(e.id, e.damager)
    }

    if (e.damageable) {
      this.damageables.set(e.id, e.damageable)
    }

    if (e.enablePlayfieldClamping) {
      this.playfieldClamped.add(e.id)
    }

    // Quadtree: for now, only add non-moving objects.
    if (e.type && [Type.TREE, Type.TURRET, Type.WALL].includes(e.type)) {
      const entityAabb = tileBox(e.transform!.position)
      this.quadtree.insert({ aabb: entityAabb, id: e.id })
    }
  }

  private unindexEntity(id: EntityId): void {
    this.entities.delete(id)

    this.transforms.delete(id)
    this.players.delete(id)
    this.moveables.delete(id)
    this.bullets.delete(id)
    this.damagers.delete(id)
    this.damageables.delete(id)
    this.playfieldClamped.delete(id)

    this.quadtree.remove(id)
  }

  public queryByWorldPos(aabb: [vec2, vec2]): EntityId[] {
    // Start with known non-moving entities
    const results = new Set<EntityId>(
      this.quadtree.query(aabb).map((r) => r.id),
    )

    // Add all known moving entities (which are not yet added to the quadtree)
    for (const [id] of this.players) {
      results.add(id)
    }

    for (const [id, e] of this.entities) {
      if (e.bullet) {
        results.add(id)
      }
    }

    return Array.from(results).sort()
  }
}
