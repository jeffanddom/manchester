import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

import { gameSrcPath, serverBuildVersionPath, serverOutputPath } from './common'

let buildVersion = '(none)'
if (process.argv.length > 2) {
  buildVersion = process.argv[2]
}

console.log(`Creating bundle for build version ${buildVersion}...`)

esbuild.buildSync({
  bundle: true,
  entryPoints: [path.join(gameSrcPath, 'server', 'main.ts')],
  outdir: serverOutputPath,
  platform: 'node',
  sourcemap: true,
  target: 'es2019',
})

// Write build version
fs.mkdirSync(path.normalize(path.join(serverBuildVersionPath, '..')), {
  recursive: true,
})
fs.writeFileSync(serverBuildVersionPath, buildVersion)
