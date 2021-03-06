import { vec4 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export enum TileType {
  Grass,
  Water,
  Mountain,
  Road,
}

export const TileTypeCount = Object.values(TileType).length / 2

export const tileTypeColor: Map<TileType, Immutable<vec4>> = new Map([
  [TileType.Grass, vec4.fromValues(126 / 255, 200 / 255, 80 / 255, 1.0)],
  [TileType.Mountain, vec4.fromValues(91 / 255, 80 / 255, 54 / 255, 1.0)],
  [TileType.Water, vec4.fromValues(43 / 255, 87 / 255, 112 / 255, 1.0)],
  [TileType.Road, vec4.fromValues(0.1, 0.1, 0.1, 1.0)],
])

export enum EntityType {
  Tank,
  Tree,
  Wall,
  Turret,
}

export const entityTypeModel: Map<EntityType, string> = new Map([
  [EntityType.Tank, 'shiba'],
  [EntityType.Tree, 'tree'],
  [EntityType.Wall, 'wall'],
  [EntityType.Turret, 'turret'],
])

export interface TileComponent {
  type: TileType
  entity?: EntityType
}

export function cloneTileComponent(
  src: Immutable<TileComponent>,
): TileComponent {
  return { type: src.type }
}
