import { performance } from 'perf_hooks'

/**
 * Return the current timestamp in seconds, with sub-millisecond precision.
 */
export const current = (): number => {
  return performance.now() / 1000
}
