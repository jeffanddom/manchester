import { vec2 } from 'gl-matrix'
import { ParticleEmitter } from './ParticleEmitter'

export const TILE_SIZE = 24
export const PLAYFIELD_TILE_WIDTH = 20
export const PLAYFIELD_TILE_HEIGHT = 15

export enum Terrain {
  Mountain,
  River,
  Grass,
  Unknown,
}

export interface Tile {
  type: Terrain
}

export enum Direction {
  North = 'N',
  South = 'S',
  East = 'E',
  West = 'W',
}

export interface GameMap {
  playfield: string
  entities: string
}

export const terrainByEncoding = {
  '.': Terrain.Grass,
  '~': Terrain.River,
  '^': Terrain.Mountain,
}

export const deserializeTerrain = (s: string): Terrain => {
  const t = terrainByEncoding[s]
  if (t === undefined) {
    return Terrain.Unknown
  }
  return t
}

export interface ITransform {
  previousPosition: vec2
  position: vec2
  orientation: number

  update(e: IEntity): void
}

export interface IWallCollider {
  hitLastFrame: boolean
  collidedWalls: IEntity[]

  update(e: IEntity): void
}

export interface IGenericComponent {
  update(e: IEntity): void
}

export interface IPathRenderable {
  fillStyle: string

  render(e: IEntity, ctx: CanvasRenderingContext2D): void
}

export interface IDamageable extends IGenericComponent {
  health: number
}

export interface IDamager extends IGenericComponent {
  damageValue: number
}

export interface IEntity {
  id?: string
  game?: IGame
  transform?: ITransform
  mover?: IGenericComponent
  shooter?: IGenericComponent
  wallCollider?: IWallCollider
  wall?: IGenericComponent
  damageable?: IDamageable
  damager?: IDamager
  prerender?: IGenericComponent
  pathRenderable?: IPathRenderable

  update: () => void
  render: (ctx: CanvasRenderingContext2D) => void
}

export interface IEntityManager {
  entities: { [key: string]: IEntity }

  register: (e: IEntity) => void
  markForDeletion: (e: IEntity) => void

  update: () => void
  render: (ctx: CanvasRenderingContext2D) => void
}

export interface IPlayfield {
  height: () => number
  width: () => number
  pixelHeight: () => number
  pixelWidth: () => number

  render: (ctx: CanvasRenderingContext2D) => void
}

export interface IKeyboard {
  downKeys: Set<number>
}

export interface IGame {
  playfield: IPlayfield
  entities: IEntityManager
  keyboard: IKeyboard
  emitters: ParticleEmitter[]
}
