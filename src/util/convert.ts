import { vec2 } from 'gl-matrix'

export type RawVec2 = { '0': number; '1': number }

export const toIntEnum = <T extends { [key: number]: number | string }>(
  e: T,
  raw: number,
): T[keyof T] | undefined => {
  if (!(raw in e)) {
    return undefined
  }
  return (raw as unknown) as T[keyof T]
}

export const toStringEnum = <T extends { [key: string]: string }>(
  e: T,
  raw: string,
): T[keyof T] | undefined => {
  if (Object.keys(e).find((k) => e[k] === raw) === undefined) {
    return undefined
  }
  return (raw as unknown) as T[keyof T]
}

export const toVec2 = (raw: RawVec2): vec2 => {
  return vec2.fromValues(raw['0'], raw['1'])
}
