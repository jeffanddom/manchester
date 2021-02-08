/**
 * A best-effort attempt to trigger the garbage collector. For Chrome and Node,
 * this will work if the interpreter was executed with the `--expose-gc` flag.
 * This is a no-op for Firefox and Safari.
 *
 * The @ts-ignore comments are, as of this writing, the simplest way to ignore
 * the fact that `gc` is not included in the standard typing of globalThis. None
 * of the various type declaration techniques I tried from StackOverflow seem
 * to work with typescript-eslint.
 */
export function gc(): boolean {
  if (gcAvailable()) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.gc()
    return true
  }

  return false
}

export function gcAvailable(): boolean {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return globalThis.gc !== undefined
}
