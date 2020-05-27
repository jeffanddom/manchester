/**
 * Return the current timestamp in seconds, with sub-millisecond precision.
 */
export const current = (): number => {
  return window.performance.now() / 1000
}
