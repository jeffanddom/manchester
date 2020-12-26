/**
 * An awaitable sleep().
 */
export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve, _) => setTimeout(resolve, ms))
}

/**
 * Generates a no-op background loop that prevents the NodeJS process from
 * terminating when no more real I/O is scheduled. Use this when you want
 * OS signals to trigger termination.
 */
export function preventDefaultTermination(): void {
  setInterval(() => {
    // do nothing
  }, 1_000_000_000)
}

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
