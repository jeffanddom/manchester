import { vec2 } from 'gl-matrix'

import { Option } from '~util/Option'

export type RawVec2 = { '0': number; '1': number }

export const toIntEnum = <T>(e: T, raw: number): Option<T[keyof T]> => {
  if ((<any>e)[raw] === undefined) {
    return Option.none()
  }
  return Option.some((raw as unknown) as T[keyof T])
}

export const toStringEnum = <T>(e: T, raw: string): Option<T[keyof T]> => {
  if (Object.keys(e).find((k) => (<any>e)[k] === raw) === undefined) {
    return Option.none()
  }
  return Option.some((raw as unknown) as T[keyof T])
}

export const toVec2 = (raw: RawVec2): vec2 => {
  return vec2.fromValues(raw['0'], raw['1'])
}
