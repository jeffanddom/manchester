import { vec2 } from 'gl-matrix'
import * as _ from 'lodash'

import { Bullet } from '~/components/Bullet'
import * as damageable from '~/components/Damageable'
import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { IRenderable } from '~/components/IRenderable'
import { Team } from '~/components/team'
import * as transform from '~/components/Transform'
import { Transform } from '~/components/Transform'
import { ComponentTable } from '~/ComponentTable'
import { EntityComponents } from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import { Type } from '~/entities/types'
import { EntitySet } from '~/EntitySet'
import { Hitbox, clone as hitboxClone } from '~/Hitbox'
import { Renderable } from '~/renderer/interfaces'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent, clone as shooterClone } from '~/systems/shooter'
import { TurretComponent } from '~/systems/turret'
import * as turret from '~/systems/turret'
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
  public currentPlayer: number
  private nextEntityIdUncommitted: number
  private nextEntityIdCommitted: number
  private toDelete: SortedSet<EntityId>
  private checkpointedEntities: SortedMap<EntityId, EntityComponents>
  private predictedRegistrations: SortedSet<EntityId>

  // components
  bullets: SortedMap<EntityId, Bullet>
  damageables: ComponentTable<Damageable>
  damagers: SortedMap<EntityId, Damager>
  dropTypes: SortedMap<EntityId, PickupType>
  hitboxes: SortedMap<EntityId, Hitbox>
  moveables: EntitySet
  obscureds: EntitySet
  obscurings: EntitySet
  playerNumbers: SortedMap<EntityId, number>
  playfieldClamped: EntitySet
  renderables: SortedMap<EntityId, IRenderable>
  shooters: ComponentTable<ShooterComponent>
  targetables: EntitySet
  teams: SortedMap<EntityId, Team>
  transforms: ComponentTable<Transform>
  turrets: ComponentTable<TurretComponent>
  types: SortedMap<EntityId, Type>
  walls: EntitySet

  // indexes
  friendlyTeam: SortedSet<EntityId>
  private quadtree: Quadtree<EntityId, QuadtreeEntity>

  constructor(playfieldAabb: [vec2, vec2]) {
    this.nextEntityIdUncommitted = 0
    this.nextEntityIdCommitted = 0
    this.currentPlayer = -1
    this.toDelete = new SortedSet()
    this.checkpointedEntities = new SortedMap()
    this.predictedRegistrations = new SortedSet()

    // components
    this.bullets = new SortedMap()
    this.damageables = new ComponentTable(damageable.clone)
    this.damagers = new SortedMap()
    this.dropTypes = new SortedMap()
    this.hitboxes = new SortedMap()
    this.moveables = new EntitySet()
    this.obscureds = new EntitySet()
    this.obscurings = new EntitySet()
    this.playerNumbers = new SortedMap()
    this.playfieldClamped = new EntitySet()
    this.renderables = new SortedMap()
    this.shooters = new ComponentTable(shooterClone)
    this.targetables = new EntitySet()
    this.teams = new SortedMap()
    this.transforms = new ComponentTable(transform.clone)
    this.turrets = new ComponentTable(turret.clone)
    this.types = new SortedMap()
    this.walls = new EntitySet()

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
      this.damageables.delete(id)
      this.moveables.delete(id)
      this.obscureds.delete(id)
      this.obscurings.delete(id)
      this.playfieldClamped.delete(id)
      this.shooters.delete(id)
      this.targetables.delete(id)
      this.transforms.delete(id)
      this.turrets.delete(id)
      this.walls.delete(id)

      this.unindexEntity(id)
    }
    this.toDelete = new SortedSet()
  }

  /**
   * TODO: replace this with autocheckpointing via ComponentTable.
   *
   * Before modifying entity state, we need to to checkpoint it. Internally,
   * this will snapshot the entity state before any updates occur. The snapshot
   * allows us to restore the state of the entity if we need to rewind changes
   * due to predicted simulation.
   */
  public checkpoint(id: EntityId): void {
    if (this.checkpointedEntities.has(id)) {
      return
    }

    this.checkpointedEntities.set(id, this.snapshotEntityComponents(id))
  }

  public undoPrediction(): void {
    this.damageables.rollback()
    this.moveables.rollback()
    this.obscureds.rollback()
    this.obscurings.rollback()
    this.playfieldClamped.rollback()
    this.shooters.rollback()
    this.targetables.rollback()
    this.transforms.rollback()
    this.turrets.rollback()
    this.walls.rollback()

    for (const [id, entity] of this.checkpointedEntities) {
      this.indexEntity(id, entity)
    }

    for (const id of this.predictedRegistrations) {
      this.unindexEntity(id)
    }

    this.nextEntityIdUncommitted = this.nextEntityIdCommitted
    this.predictedRegistrations = new SortedSet()
    this.checkpointedEntities = new SortedMap()
  }

  public commitPrediction(): void {
    this.damageables.commit()
    this.moveables.commit()
    this.obscureds.commit()
    this.obscurings.commit()
    this.playfieldClamped.commit()
    this.shooters.commit()
    this.targetables.commit()
    this.transforms.commit()
    this.turrets.commit()
    this.walls.commit()

    this.nextEntityIdCommitted = this.nextEntityIdUncommitted
    this.predictedRegistrations = new SortedSet()
    this.checkpointedEntities = new SortedMap()
  }

  public getRenderables(aabb: [vec2, vec2]): Renderable[] {
    const renderables: Renderable[] = []
    for (const id of this.queryByWorldPos(aabb)) {
      const r = this.renderables.get(id)
      if (!r) {
        continue
      }
      renderables.push(...r.getRenderables(this, id))
    }
    return renderables
  }

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

    if (e.damageable) {
      this.damageables.set(id, e.damageable)
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

    if (e.targetable) {
      this.targetables.add(id)
    }

    if (e.shooter) {
      this.shooters.set(id, e.shooter)
    }

    if (e.transform) {
      this.transforms.set(id, e.transform)
    }

    if (e.turret) {
      this.turrets.set(id, e.turret)
    }

    if (e.wall) {
      this.walls.add(id)
    }

    this.indexEntity(id, e)
  }

  public markForDeletion(id: EntityId): void {
    this.checkpoint(id)
    this.toDelete.add(id)
  }

  private indexEntity(id: EntityId, e: EntityComponents): void {
    // components

    if (e.bullet) {
      this.bullets.set(id, e.bullet)
    }

    if (e.damager) {
      this.damagers.set(id, e.damager)
    }

    if (e.dropType) {
      this.dropTypes.set(id, e.dropType)
    }

    if (e.hitbox) {
      this.hitboxes.set(id, e.hitbox)
    }

    if (e.playerNumber !== undefined) {
      this.playerNumbers.set(id, e.playerNumber)
    }

    if (e.renderable) {
      this.renderables.set(id, e.renderable)
    }

    if (e.team !== undefined) {
      this.teams.set(id, e.team)
    }

    if (e.type) {
      this.types.set(id, e.type)
    }

    // indexes

    if (e.team === Team.Friendly) {
      this.friendlyTeam.add(id)
    }

    // For now, only add non-moving objects to the quadtree.
    if (e.type && [Type.TREE, Type.TURRET, Type.WALL].includes(e.type)) {
      const entityAabb = tileBox(this.transforms.get(id)!.position)
      this.quadtree.insert({ aabb: entityAabb, id: id })
    }
  }

  private unindexEntity(id: EntityId): void {
    // components
    this.bullets.delete(id)
    this.damagers.delete(id)
    this.dropTypes.delete(id)
    this.hitboxes.delete(id)
    this.playerNumbers.delete(id)
    this.renderables.delete(id)
    this.teams.delete(id)
    this.types.delete(id)

    // indexes
    this.friendlyTeam.delete(id)
    this.quadtree.remove(id)
  }

  private snapshotEntityComponents(id: EntityId): EntityComponents {
    const e: EntityComponents = {}

    const bullet = this.bullets.get(id)
    if (bullet) {
      e.bullet = bullet.clone()
    }

    const damager = this.damagers.get(id)
    if (damager) {
      e.damager = damager.clone()
    }

    const dropType = this.dropTypes.get(id)
    if (dropType) {
      e.dropType = dropType
    }

    const hitbox = this.hitboxes.get(id)
    if (hitbox) {
      e.hitbox = hitboxClone(hitbox)
    }

    const playerNumber = this.playerNumbers.get(id)
    if (playerNumber !== undefined) {
      e.playerNumber = playerNumber
    }
    const renderable = this.renderables.get(id)
    if (renderable) {
      e.renderable = _.cloneDeep(renderable) // TODO: get rid of this!
    }

    const team = this.teams.get(id)
    if (team !== undefined) {
      e.team = team
    }

    const type = this.types.get(id)
    if (type) {
      e.type = type
    }

    return e
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
