export function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result: Set<T> = new Set()
  for (const elem of b) {
    if (a.has(elem)) {
      result.add(elem)
    }
  }
  return result
}
