/**
 * CLI entrypoint. Run this to perform a single check for long-lived cloud-dev
 * hosts.
 */

import { run } from './run'

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
