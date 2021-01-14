import * as esbuild from 'esbuild'

import { serverBuildOpts, writeServerBuildVersion } from './common'

async function main(): Promise<void> {
  let buildVersion = '(none)'
  if (process.argv.length > 2) {
    buildVersion = process.argv[2]
  }

  console.log(`Creating bundle for build version ${buildVersion}...`)

  await esbuild.build(serverBuildOpts)

  await writeServerBuildVersion(buildVersion)
}

main()
