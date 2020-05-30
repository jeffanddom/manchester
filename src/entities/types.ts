import { IEntity } from '~/entities/interfaces'
import { makeWall } from '~/entities/Wall'
import { makeTurret } from '~/entities/turret'
import { makePlayer } from '~/entities/player'

export enum Type {
  PLAYER = 'PLAYER',
  TURRET = 'TURRET',
  WALL = 'WALL',
}

const entityTypeDefinitions = {
  [Type.PLAYER]: { make: makePlayer, serialized: 'p' },
  [Type.TURRET]: { make: makeTurret, serialized: 't' },
  [Type.WALL]: { make: makeWall, serialized: 'w' },
}

export const make = (t: Type): IEntity => {
  for (let k in entityTypeDefinitions) {
    if (k !== t) {
      continue
    }
    return entityTypeDefinitions[k].make()
  }
  throw new Error(`invalid entity type ${t}`)
}

export const serialize = (t: Type): string => {
  for (let k in entityTypeDefinitions) {
    if (k !== t) {
      continue
    }
    return entityTypeDefinitions[k].serialized
  }
  throw new Error(`invalid entity type ${t}`)
}

export const deserialize = (s: string): Type | undefined => {
  for (let k in entityTypeDefinitions) {
    const c = k as keyof typeof Type
    if (entityTypeDefinitions[c].serialized === s) {
      return Type[c]
    }
  }
  return undefined
}
