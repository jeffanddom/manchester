import { vec2 } from 'gl-matrix'

import { None, Option, Some } from '~/util/Option'

export type RawVec2 = { '0': number; '1': number }

export const toIntEnum = <T extends { [key: number]: number | string }>(
  e: T,
  raw: number,
): Option<T[keyof T]> => {
  if (e[raw] === undefined) {
    return None()
  }
  return Some((raw as unknown) as T[keyof T])
}

export const toStringEnum = <T extends { [key: string]: string }>(
  e: T,
  raw: string,
): Option<T[keyof T]> => {
  if (Object.keys(e).find((k) => e[k] === raw) === undefined) {
    return None()
  }
  return Some((raw as unknown) as T[keyof T])
}

export const toVec2 = (raw: RawVec2): vec2 => {
  return vec2.fromValues(raw['0'], raw['1'])
}
