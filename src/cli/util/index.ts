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
