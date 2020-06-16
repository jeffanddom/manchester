import { TILE_SIZE } from '~/constants'
import { Entity } from '~/entities/Entity'
import { makePlayer } from '~/entities/player'
import { makeTurret } from '~/entities/turret'
import { makeWall } from '~/entities/Wall'
import { path2 } from '~/util/path2'

export enum Type {
  PLAYER = 'PLAYER',
  TURRET = 'TURRET',
  WALL = 'WALL',
}

export const typeDefinitions = {
  [Type.PLAYER]: {
    make: makePlayer,
    serialized: 'p',
    model: {
      path: path2.fromValues([
        [0, -TILE_SIZE * 0.5],
        [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
        [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
      ]),
      fillStyle: 'black',
    },
  },
  [Type.TURRET]: {
    make: makeTurret,
    serialized: 't',
    model: {
      path: path2.fromValues([
        [0, -TILE_SIZE * 0.5],
        [TILE_SIZE * 0.3, TILE_SIZE * 0.5],
        [-TILE_SIZE * 0.3, TILE_SIZE * 0.5],
      ]),
      fillStyle: '#FF0',
    },
  },
  [Type.WALL]: {
    make: makeWall,
    serialized: 'w',
    model: {
      path: path2.fromValues([
        [-TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
        [TILE_SIZE * 0.5, -TILE_SIZE * 0.5],
        [TILE_SIZE * 0.5, TILE_SIZE * 0.5],
        [-TILE_SIZE * 0.5, TILE_SIZE * 0.5],
      ]),
      fillStyle: 'rgba(130, 130, 130, 1)',
    },
  },
}

export const make = (t: Type): Entity => {
  for (const k in typeDefinitions) {
    if (k !== t) {
      continue
    }
    const def = typeDefinitions[k]
    return def.make(def.model)
  }
  throw new Error(`invalid entity type ${t}`)
}

export const serialize = (t: Type): string => {
  for (const k in typeDefinitions) {
    if (k !== t) {
      continue
    }
    return typeDefinitions[k].serialized
  }
  throw new Error(`invalid entity type ${t}`)
}

export const deserialize = (s: string): Type | undefined => {
  for (const k in typeDefinitions) {
    const c = k as keyof typeof Type
    if (typeDefinitions[c].serialized === s) {
      return Type[c]
    }
  }
  return undefined
}
