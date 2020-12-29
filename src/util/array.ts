/**
 * Discard elements from an array, starting from the beginning until the
 * predicate returns true.
 */
export function discardUntil<T>(
  elements: T[],
  predicate: (val: T) => boolean,
): T[] {
  const n = elements.findIndex(predicate)
  if (n < 0) {
    return []
  }
  return elements.slice(n)
}
