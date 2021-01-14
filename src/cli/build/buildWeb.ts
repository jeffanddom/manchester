import * as esbuild from 'esbuild'

import { copyWebHtml, updateWebBuildVersion, webBuildOpts } from './common'

async function main(): Promise<void> {
  let buildVersion = '(none)'
  if (process.argv.length > 2) {
    buildVersion = process.argv[2]
  }

  console.log(`Creating bundle for build version ${buildVersion}...`)

  await updateWebBuildVersion(buildVersion)
  await esbuild.build(webBuildOpts)
  await copyWebHtml()
}

main()
