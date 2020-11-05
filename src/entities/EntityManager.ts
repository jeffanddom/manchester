import { vec2 } from 'gl-matrix'
import * as _ from 'lodash'

import { Type } from './types'

import { Bullet } from '~/components/Bullet'
import { Damageable } from '~/components/Damageable'
import { Damager } from '~/components/Damager'
import { IRenderable } from '~/components/IRenderable'
import { Team } from '~/components/team'
import * as transform from '~/components/transform'
import { ITransform } from '~/components/transform'
import { EntityId } from '~/entities/EntityId'
import { EntityProperties } from '~/entities/EntityProperties'
import { Hitbox } from '~/Hitbox'
import { Renderable } from '~/renderer/interfaces'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent } from '~/systems/shooter'
import { TurretComponent } from '~/systems/turret'
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
  private toDelete: SortedSet<EntityId>
  private checkpointedEntities: SortedMap<EntityId, EntityProperties>
  private predictedRegistrations: SortedSet<EntityId>
  private predictedDeletes: SortedSet<EntityId>

  // TODO: make these private
  bullets: SortedMap<EntityId, Bullet>
  damageables: SortedMap<EntityId, Damageable>
  damagers: SortedMap<EntityId, Damager>
  dropTypes: SortedMap<EntityId, PickupType>
  friendlyTeam: SortedSet<EntityId>
  hitboxes: SortedMap<EntityId, Hitbox>
  moveables: SortedSet<EntityId>
  obscureds: SortedSet<EntityId>
  obscurings: SortedSet<EntityId>
  playerNumbers: SortedMap<EntityId, number>
  playfieldClamped: SortedSet<EntityId>
  renderables: SortedMap<EntityId, IRenderable>
  shooters: SortedMap<EntityId, ShooterComponent>
  targetables: SortedSet<EntityId>
  teams: SortedMap<EntityId, Team>
  transforms: SortedMap<EntityId, ITransform>
  turrets: SortedMap<EntityId, TurretComponent>
  types: SortedMap<EntityId, Type>
  walls: SortedSet<EntityId>

  // To include: walls, trees, turrets
  private quadtree: Quadtree<EntityId, QuadtreeEntity>

  constructor(playfieldAabb: [vec2, vec2]) {
    this.nextEntityId = 0
    this.toDelete = new SortedSet()
    this.checkpointedEntities = new SortedMap()
    this.predictedRegistrations = new SortedSet()
    this.predictedDeletes = new SortedSet()

    this.bullets = new SortedMap()
    this.damageables = new SortedMap()
    this.damagers = new SortedMap()
    this.dropTypes = new SortedMap()
    this.friendlyTeam = new SortedSet()
    this.hitboxes = new SortedMap()
    this.moveables = new SortedSet()
    this.obscureds = new SortedSet()
    this.obscurings = new SortedSet()
    this.playerNumbers = new SortedMap()
    this.playfieldClamped = new SortedSet()
    this.renderables = new SortedMap()
    this.shooters = new SortedMap()
    this.targetables = new SortedSet()
    this.teams = new SortedMap()
    this.transforms = new SortedMap()
    this.turrets = new SortedMap()
    this.types = new SortedMap()
    this.walls = new SortedSet()

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
    this.toDelete = new SortedSet()
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

    this.checkpointedEntities.set(id, this.getEntityProperties(id))
  }

  public undoPrediction(): void {
    for (const [, entity] of this.checkpointedEntities) {
      this.indexEntity(entity)
    }
    this.checkpointedEntities = new SortedMap()
    this.predictedDeletes = new SortedSet()

    for (const id of this.predictedRegistrations) {
      this.unindexEntity(id)
    }

    this.nextEntityId -= this.predictedRegistrations.size()
    this.predictedRegistrations = new SortedSet()
  }

  public commitPrediction(): void {
    this.predictedRegistrations = new SortedSet()
    this.predictedDeletes = new SortedSet()
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

  public register(e: EntityProperties): void {
    e.id = this.nextEntityId.toString() as EntityId
    this.nextEntityId++
    this.predictedRegistrations.add(e.id)

    this.indexEntity(e)
  }

  public markForDeletion(id: EntityId): void {
    this.checkpoint(id)
    this.toDelete.add(id)
  }

  private indexEntity(e: EntityProperties): void {
    if (e.bullet) {
      this.bullets.set(e.id, e.bullet)
    }

    if (e.damageable) {
      this.damageables.set(e.id, e.damageable)
    }

    if (e.damager) {
      this.damagers.set(e.id, e.damager)
    }

    if (e.dropType) {
      this.dropTypes.set(e.id, e.dropType)
    }

    if (e.team === Team.Friendly) {
      this.friendlyTeam.add(e.id)
    }

    if (e.hitbox) {
      this.hitboxes.set(e.id, e.hitbox)
    }

    if (e.moveable) {
      this.moveables.add(e.id)
    }

    if (e.playerNumber) {
      this.playerNumbers.set(e.id, e.playerNumber)
    }

    if (e.playfieldClamped) {
      this.playfieldClamped.add(e.id)
    }

    if (e.obscured) {
      this.obscureds.add(e.id)
    }

    if (e.obscuring) {
      this.obscurings.add(e.id)
    }

    if (e.renderable) {
      this.renderables.set(e.id, e.renderable)
    }

    if (e.shooter) {
      this.shooters.set(e.id, e.shooter)
    }

    if (e.targetable) {
      this.targetables.add(e.id)
    }

    this.teams.set(e.id, e.team)

    if (e.transform) {
      this.transforms.set(e.id, e.transform)
    }

    if (e.turret) {
      this.turrets.set(e.id, e.turret)
    }

    if (e.type) {
      this.types.set(e.id, e.type)
    }

    if (e.wall) {
      this.walls.add(e.id)
    }

    // Quadtree: for now, only add non-moving objects.
    if (e.type && [Type.TREE, Type.TURRET, Type.WALL].includes(e.type)) {
      const entityAabb = tileBox(e.transform!.position)
      this.quadtree.insert({ aabb: entityAabb, id: e.id })
    }
  }

  private unindexEntity(id: EntityId): void {
    this.bullets.delete(id)
    this.damageables.delete(id)
    this.damagers.delete(id)
    this.dropTypes.delete(id)
    this.friendlyTeam.delete(id)
    this.hitboxes.delete(id)
    this.moveables.delete(id)
    this.obscureds.delete(id)
    this.obscurings.delete(id)
    this.playerNumbers.delete(id)
    this.playfieldClamped.delete(id)
    this.renderables.delete(id)
    this.shooters.delete(id)
    this.targetables.delete(id)
    this.teams.delete(id)
    this.transforms.delete(id)
    this.turrets.delete(id)
    this.types.delete(id)
    this.walls.delete(id)

    this.quadtree.remove(id)
  }

  private getEntityProperties(id: EntityId): EntityProperties {
    const e: EntityProperties = {
      id: id,
      moveable: this.moveables.has(id),
      obscured: this.obscureds.has(id),
      obscuring: this.obscurings.has(id),
      targetable: this.targetables.has(id),
      team: this.teams.get(id)!,
      wall: this.walls.has(id),
    }

    const bullet = this.bullets.get(id)
    if (bullet) {
      e.bullet = bullet.clone()
    }

    const damageable = this.damageables.get(id)
    if (damageable) {
      e.damageable = damageable.clone()
    }

    const damager = this.damagers.get(id)
    if (damager) {
      e.damager = damager.clone()
    }

    const hitbox = this.hitboxes.get(id)
    if (hitbox) {
      e.hitbox = hitbox.clone()
    }

    const playerNumber = this.playerNumbers.get(id)
    if (playerNumber) {
      e.playerNumber = playerNumber
    }

    e.playfieldClamped = this.playfieldClamped.has(id)

    const renderable = this.renderables.get(id)
    if (renderable) {
      e.renderable = _.cloneDeep(renderable) // TODO: get rid of this!
    }

    const shooter = this.shooters.get(id)
    if (shooter) {
      e.shooter = shooter.clone()
    }

    const xform = this.transforms.get(id)
    if (xform) {
      e.transform = transform.clone(xform)
    }

    const turret = this.turrets.get(id)
    if (turret) {
      e.turret = turret.clone()
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
