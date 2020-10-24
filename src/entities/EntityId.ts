enum EntityIdBrand {
  _ = '',
}

export type EntityId = string & EntityIdBrand

export const castToEntityId = (s: string): EntityId => {
  return s as EntityId
}
