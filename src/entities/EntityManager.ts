import { vec2 } from 'gl-matrix'
import ndarray from 'ndarray'

import * as bullet from '~/components/Bullet'
import { Bullet } from '~/components/Bullet'
import * as damageable from '~/components/Damageable'
import { Damageable } from '~/components/Damageable'
import { EntityModel } from '~/components/EntityModel'
import { Hitbox, clone as hitboxClone } from '~/components/Hitbox'
import { Team } from '~/components/team'
import * as transform from '~/components/Transform'
import { Transform } from '~/components/Transform'
import * as transform3 from '~/components/Transform3'
import { Transform3 } from '~/components/Transform3'
import { ComponentTable } from '~/entities/ComponentTable'
import { EntityComponents } from '~/entities/EntityComponents'
import { EntityId } from '~/entities/EntityId'
import { EntitySet } from '~/entities/EntitySet'
import { EntityStateContainer } from '~/entities/EntityStateContainer'
import { Type } from '~/entities/types'
import * as builder from '~/systems/builder'
import * as attack from '~/systems/damager'
import { EmitterComponent, emitterClone } from '~/systems/emitter'
import { PickupType } from '~/systems/pickups'
import { ShooterComponent, clone as shooterClone } from '~/systems/shooter'
import {
  TankMoverComponent,
  clone as tankMoverClone,
} from '~/systems/tankMover'
import { TurretComponent } from '~/systems/turret'
import * as turret from '~/systems/turret'
import { Aabb2 } from '~/util/aabb2'
import { Quadtree } from '~/util/quadtree'
import { minBiasAabbOverlap } from '~/util/quadtree/helpers'
import { SortedSet } from '~/util/SortedSet'
import { tileBox, tileCoords } from '~/util/tileMath'

// l1-path-finder is not typed. Fix this, Jeff and Dom.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createPlanner = require('l1-path-finder')

type QuadtreeEntity = {
  id: EntityId
  aabb: Aabb2
}

export class EntityManager {
  public currentPlayer: number
  private nextEntityIdUncommitted: number
  private nextEntityIdCommitted: number
  private toDelete: SortedSet<EntityId>
  private predictedDeletes: SortedSet<EntityId>
  private predictedRegistrations: SortedSet<EntityId>

  // components
  builders: ComponentTable<builder.Builder>
  bullets: ComponentTable<Bullet>
  damageables: ComponentTable<Damageable>
  damagers: ComponentTable<attack.Damager>
  dropTypes: ComponentTable<PickupType>
  emitters: ComponentTable<EmitterComponent>
  explosions: EntitySet
  hitboxes: ComponentTable<Hitbox>
  moveables: EntitySet
  obscureds: EntitySet
  obscurings: EntitySet
  playerNumbers: ComponentTable<number>
  playfieldClamped: EntitySet
  renderables: ComponentTable<string>
  entityModels: ComponentTable<EntityModel>
  shooters: ComponentTable<ShooterComponent>
  tankMovers: ComponentTable<TankMoverComponent>
  targetables: EntitySet
  teams: ComponentTable<Team>
  transforms: ComponentTable<Transform>
  transform3s: ComponentTable<Transform3>
  turrets: ComponentTable<TurretComponent>
  types: ComponentTable<Type>
  walls: EntitySet

  private allContainers: EntityStateContainer[]

  // indexes
  friendlyTeam: SortedSet<EntityId>
  private quadtree: Quadtree<EntityId, QuadtreeEntity>
  private obstacleGrid: ndarray.NdArray
  private obstacleGridDirty: boolean

  // TODO: we still need to add type annotations for l1-path-finder.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  routePlanner: any

  constructor(playfieldAabb: Aabb2) {
    this.nextEntityIdUncommitted = 0
    this.nextEntityIdCommitted = 0
    this.currentPlayer = -1
    this.toDelete = new SortedSet()
    this.predictedDeletes = new SortedSet()
    this.predictedRegistrations = new SortedSet()

    // components
    this.builders = new ComponentTable(builder.clone)
    this.bullets = new ComponentTable(bullet.clone)
    this.damageables = new ComponentTable(damageable.clone)
    this.damagers = new ComponentTable(attack.clone)
    this.dropTypes = new ComponentTable((c) => c)
    this.emitters = new ComponentTable(emitterClone)
    this.entityModels = new ComponentTable((c) => c) // TODO: should we clone this?
    this.explosions = new EntitySet()
    this.hitboxes = new ComponentTable(hitboxClone)
    this.moveables = new EntitySet()
    this.obscureds = new EntitySet()
    this.obscurings = new EntitySet()
    this.playerNumbers = new ComponentTable((c) => c)
    this.playfieldClamped = new EntitySet()
    this.renderables = new ComponentTable((c) => c)
    this.shooters = new ComponentTable(shooterClone)
    this.tankMovers = new ComponentTable(tankMoverClone)
    this.targetables = new EntitySet()
    this.teams = new ComponentTable((c) => c)
    this.transforms = new ComponentTable(transform.clone)
    this.transform3s = new ComponentTable(transform3.clone)
    this.turrets = new ComponentTable(turret.clone)
    this.types = new ComponentTable((c) => c)
    this.walls = new EntitySet()

    this.allContainers = [
      this.builders,
      this.bullets,
      this.damageables,
      this.damagers,
      this.dropTypes,
      this.emitters,
      this.entityModels,
      this.explosions,
      this.hitboxes,
      this.moveables,
      this.obscureds,
      this.obscurings,
      this.playerNumbers,
      this.playfieldClamped,
      this.renderables,
      this.shooters,
      this.tankMovers,
      this.targetables,
      this.teams,
      this.transforms,
      this.transform3s,
      this.turrets,
      this.types,
      this.walls,
    ]

    // indexes
    this.friendlyTeam = new SortedSet()
    this.quadtree = new Quadtree<EntityId, QuadtreeEntity>({
      maxItems: 4,
      aabb: playfieldAabb,
      comparator: (aabb: Aabb2, e: QuadtreeEntity) => {
        return minBiasAabbOverlap(aabb, e.aabb)
      },
    })
    this.obstacleGrid = ndarray(new Float32Array(4096), [64, 64])
    this.obstacleGridDirty = false
    this.routePlanner = createPlanner(this.obstacleGrid)
  }

  public undoPrediction(): void {
    // Make sure to unindex using the current container state.
    for (const id of this.predictedRegistrations) {
      this.unindexEntity(id)
    }

    for (const container of this.allContainers) {
      container.rollback()
    }

    for (const id of this.predictedDeletes) {
      this.indexEntity(id)
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

  public postFrameUpdate(): void {
    for (const id of this.toDelete) {
      // Make sure to unindex using the current container state.
      this.unindexEntity(id)

      for (const container of this.allContainers) {
        container.delete(id)
      }

      if (this.predictedRegistrations.has(id)) {
        // Single-frame entity case
        this.predictedRegistrations.delete(id)
      } else {
        this.predictedDeletes.add(id)
      }
    }
    this.toDelete = new SortedSet()
    if (this.obstacleGridDirty) {
      this.obstacleGridDirty = false
      this.routePlanner = createPlanner(this.obstacleGrid)
    }
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

    if (e.builder !== undefined) {
      this.builders.set(id, e.builder)
    }

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

    if (e.emitter !== undefined) {
      this.emitters.set(id, e.emitter)
    }

    if (e.entityModel !== undefined) {
      this.entityModels.set(id, e.entityModel)
    }

    if (e.explosion ?? false) {
      this.explosions.add(id)
    }

    if (e.hitbox !== undefined) {
      this.hitboxes.set(id, e.hitbox)
    }

    if (e.moveable ?? false) {
      this.moveables.add(id)
    }

    if (e.obscured ?? false) {
      this.obscureds.add(id)
    }

    if (e.obscuring ?? false) {
      this.obscurings.add(id)
    }

    if (e.playerNumber !== undefined) {
      this.playerNumbers.set(id, e.playerNumber)
    }

    if (e.playfieldClamped ?? false) {
      this.playfieldClamped.add(id)
    }

    if (e.renderable !== undefined) {
      this.renderables.set(id, e.renderable)
    }

    if (e.shooter !== undefined) {
      this.shooters.set(id, e.shooter)
    }

    if (e.tankMover !== undefined) {
      this.tankMovers.set(id, e.tankMover)
    }

    if (e.targetable ?? false) {
      this.targetables.add(id)
    }

    if (e.team !== undefined) {
      this.teams.set(id, e.team)
    }

    if (e.transform !== undefined) {
      this.transforms.set(id, e.transform)
    }

    if (e.transform3 !== undefined) {
      this.transform3s.set(id, e.transform3)
    }

    if (e.turret !== undefined) {
      this.turrets.set(id, e.turret)
    }

    if (e.type !== undefined) {
      this.types.set(id, e.type)
    }

    if (e.wall ?? false) {
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

    if (this.walls.has(id)) {
      const wallCoord = vec2.create()
      tileCoords(wallCoord, this.transforms.get(id)!.position)
      this.obstacleGrid.set(wallCoord[0] + 32, wallCoord[1] + 32, 1)
      this.obstacleGridDirty = true
    }
  }

  // FIXME: unindexing only occurs on deletes, not updates.
  private unindexEntity(id: EntityId): void {
    this.friendlyTeam.delete(id)
    this.quadtree.remove(id)

    if (this.walls.has(id)) {
      const wallCoord = vec2.create()
      tileCoords(wallCoord, this.transforms.get(id)!.position)
      this.obstacleGrid.set(wallCoord[0] + 32, wallCoord[1] + 32, 0)
      this.obstacleGridDirty = true
    }
  }

  public queryByWorldPos(aabb: Aabb2): EntityId[] {
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
