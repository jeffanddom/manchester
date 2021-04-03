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

/**
 * Create a deep clone of an object, replacing JSON-deserialized Float32Array
 * representations to actual Float32Array objects. When serialized to JSON,
 * Float32Array objects are converted to key/value objects with stringified
 * integer keys.
 *
 * This is a bit of a hack; we should consider making a bonafide serialization
 * format that is typesafe and does validation.
 */
export function deepRehydrateFloat32Arrays(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((elem) => deepRehydrateFloat32Arrays(elem))
  }

  if (typeof obj === 'object' && obj !== null) {
    if ('0' in obj) {
      return new Float32Array(Object.values(obj))
    }

    const typedObj = obj as Record<string, unknown>
    const res: Record<string, unknown> = {}
    for (const k in typedObj) {
      res[k] = deepRehydrateFloat32Arrays(typedObj[k])
    }
    return res
  }

  // We assume that obj is a non-collection immutable value.
  return obj
}
