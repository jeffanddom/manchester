import { vec2 } from 'gl-matrix'

import * as bullet from '~/components/Bullet'
import { Bullet } from '~/components/Bullet'
import * as damageable from '~/components/Damageable'
import { Damageable } from '~/components/Damageable'
import * as damager from '~/components/Damager'
import { Damager } from '~/components/Damager'
import { Team } from '~/components/team'
import * as transform from '~/components/Transform'
import { Transform } from '~/components/Transform'
import { ComponentTable } from '~/ComponentTable'
import { EntityComponents } from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import { Type } from '~/entities/types'
import { EntitySet } from '~/EntitySet'
import { EntityStateContainer } from '~/EntityStateContainer'
import { Hitbox, clone as hitboxClone } from '~/Hitbox'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent, clone as shooterClone } from '~/systems/shooter'
import { TurretComponent } from '~/systems/turret'
import * as turret from '~/systems/turret'
import { Quadtree } from '~/util/quadtree'
import { minBiasAabbOverlap } from '~/util/quadtree/helpers'
import { SortedSet } from '~/util/SortedSet'
import { tileBox } from '~/util/tileMath'

type QuadtreeEntity = {
  id: EntityId
  aabb: [vec2, vec2]
}

export class EntityManager {
  public currentPlayer: number
  private nextEntityIdUncommitted: number
  private nextEntityIdCommitted: number
  private toDelete: SortedSet<EntityId>
  private predictedDeletes: SortedSet<EntityId>
  private predictedRegistrations: SortedSet<EntityId>

  // components
  bullets: ComponentTable<Bullet>
  damageables: ComponentTable<Damageable>
  damagers: ComponentTable<Damager>
  dropTypes: ComponentTable<PickupType>
  hitboxes: ComponentTable<Hitbox>
  moveables: EntitySet
  obscureds: EntitySet
  obscurings: EntitySet
  playerNumbers: ComponentTable<number>
  playfieldClamped: EntitySet
  renderables: ComponentTable<string>
  shooters: ComponentTable<ShooterComponent>
  targetables: EntitySet
  teams: ComponentTable<Team>
  transforms: ComponentTable<Transform>
  turrets: ComponentTable<TurretComponent>
  types: ComponentTable<Type>
  walls: EntitySet

  private allContainers: EntityStateContainer[]

  // indexes
  friendlyTeam: SortedSet<EntityId>
  private quadtree: Quadtree<EntityId, QuadtreeEntity>

  constructor(playfieldAabb: [vec2, vec2]) {
    this.nextEntityIdUncommitted = 0
    this.nextEntityIdCommitted = 0
    this.currentPlayer = -1
    this.toDelete = new SortedSet()
    this.predictedDeletes = new SortedSet()
    this.predictedRegistrations = new SortedSet()

    // components
    this.bullets = new ComponentTable(bullet.clone)
    this.damageables = new ComponentTable(damageable.clone)
    this.damagers = new ComponentTable(damager.clone)
    this.dropTypes = new ComponentTable((c) => c)
    this.hitboxes = new ComponentTable(hitboxClone)
    this.moveables = new EntitySet()
    this.obscureds = new EntitySet()
    this.obscurings = new EntitySet()
    this.playerNumbers = new ComponentTable((c) => c)
    this.playfieldClamped = new EntitySet()
    this.renderables = new ComponentTable((c) => c)
    this.shooters = new ComponentTable(shooterClone)
    this.targetables = new EntitySet()
    this.teams = new ComponentTable((c) => c)
    this.transforms = new ComponentTable(transform.clone)
    this.turrets = new ComponentTable(turret.clone)
    this.types = new ComponentTable((c) => c)
    this.walls = new EntitySet()

    this.allContainers = [
      this.bullets,
      this.damageables,
      this.damagers,
      this.dropTypes,
      this.hitboxes,
      this.moveables,
      this.obscureds,
      this.obscurings,
      this.playerNumbers,
      this.playfieldClamped,
      this.renderables,
      this.shooters,
      this.targetables,
      this.teams,
      this.transforms,
      this.turrets,
      this.types,
      this.walls,
    ]

    // indexes
    this.friendlyTeam = new SortedSet()
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
      for (const container of this.allContainers) {
        container.delete(id)
      }

      this.unindexEntity(id)
      this.predictedDeletes.add(id)
    }
    this.toDelete = new SortedSet()
  }

  public undoPrediction(): void {
    for (const container of this.allContainers) {
      container.rollback()
    }

    for (const id of this.predictedDeletes) {
      this.indexEntity(id)
    }

    for (const id of this.predictedRegistrations) {
      this.unindexEntity(id)
    }

    this.nextEntityIdUncommitted = this.nextEntityIdCommitted
    this.predictedRegistrations = new SortedSet()
    this.predictedDeletes = new SortedSet()
  }

  public commitPrediction(): void {
    for (const container of this.allContainers) {
      container.commit()
    }

    this.nextEntityIdCommitted = this.nextEntityIdUncommitted
    this.predictedRegistrations = new SortedSet()
    this.predictedDeletes = new SortedSet()
  }

  // public getRenderables(aabb: [vec2, vec2]): Renderable[] {
  //   const renderables: Renderable[] = []
  //   for (const id of this.queryByWorldPos(aabb)) {
  //     const r = this.renderables.get(id)
  //     if (!r) {
  //       continue
  //     }

  //     // an as-cast is required here to call member variables. Eventually, we
  //     // should transform this object into a plain-old-data structure instead
  //     // of a class.
  //     renderables.push(...(r as IRenderable).getRenderables(this, id))
  //   }
  //   return renderables
  // }

  public getPlayerId(playerNumber: number): EntityId | undefined {
    for (const [id, n] of this.playerNumbers) {
      if (n === playerNumber) {
        return id
      }
    }

    return undefined
  }

  public register(e: EntityComponents): void {
    const id = this.nextEntityIdUncommitted as EntityId
    this.nextEntityIdUncommitted++
    this.predictedRegistrations.add(id)

    if (e.bullet !== undefined) {
      this.bullets.set(id, e.bullet)
    }

    if (e.damageable !== undefined) {
      this.damageables.set(id, e.damageable)
    }

    if (e.damager !== undefined) {
      this.damagers.set(id, e.damager)
    }

    if (e.dropType !== undefined) {
      this.dropTypes.set(id, e.dropType)
    }

    if (e.hitbox !== undefined) {
      this.hitboxes.set(id, e.hitbox)
    }

    if (e.moveable) {
      this.moveables.add(id)
    }

    if (e.playfieldClamped) {
      this.playfieldClamped.add(id)
    }

    if (e.obscured) {
      this.obscureds.add(id)
    }

    if (e.obscuring) {
      this.obscurings.add(id)
    }

    if (e.playerNumber !== undefined) {
      this.playerNumbers.set(id, e.playerNumber)
    }

    if (e.renderable !== undefined) {
      this.renderables.set(id, e.renderable)
    }

    if (e.targetable) {
      this.targetables.add(id)
    }

    if (e.team !== undefined) {
      this.teams.set(id, e.team)
    }

    if (e.shooter !== undefined) {
      this.shooters.set(id, e.shooter)
    }

    if (e.transform !== undefined) {
      this.transforms.set(id, e.transform)
    }

    if (e.turret !== undefined) {
      this.turrets.set(id, e.turret)
    }

    if (e.type !== undefined) {
      this.types.set(id, e.type)
    }

    if (e.wall) {
      this.walls.add(id)
    }

    this.indexEntity(id)
  }

  public markForDeletion(id: EntityId): void {
    this.toDelete.add(id)
  }

  // FIXME: indexing only occurs on registers, not updates.
  private indexEntity(id: EntityId): void {
    if (this.teams.get(id) === Team.Friendly) {
      this.friendlyTeam.add(id)
    }

    // For now, only add non-moving objects to the quadtree.
    const entityType = this.types.get(id)
    if (
      entityType !== undefined &&
      [Type.TREE, Type.TURRET, Type.WALL].includes(entityType)
    ) {
      const entityAabb = tileBox(this.transforms.get(id)!.position)
      this.quadtree.insert({ aabb: entityAabb, id: id })
    }
  }

  // FIXME: unindexing only occurs on deletes, not updates.
  private unindexEntity(id: EntityId): void {
    this.friendlyTeam.delete(id)
    this.quadtree.remove(id)
  }

  public queryByWorldPos(aabb: [vec2, vec2]): EntityId[] {
    // Start with known non-moving entities
    const results = new Set<EntityId>(
      this.quadtree.query(aabb).map((r) => r.id),
    )

    // Add all known moving entities (which are not yet added to the quadtree)
    for (const [id] of this.playerNumbers) {
      results.add(id)
    }

    for (const [id] of this.bullets) {
      results.add(id)
    }

    return Array.from(results).sort()
  }
}
