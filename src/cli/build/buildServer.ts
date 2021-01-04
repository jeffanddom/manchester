import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

import { buildVersionPath, gameSrcPath, serverBuildOutputPath } from './common'

function getMtimeMs(filepath: string): number {
  const stats = fs.statSync(filepath)
  if (stats.isDirectory()) {
    const files = fs.readdirSync(filepath)
    const mtimes = files.map((f) => getMtimeMs(path.join(filepath, f)))
    return mtimes.reduce((accum, t) => Math.max(accum, t), -1)
  }

  return stats.mtimeMs
}

console.log('Creating bundle...')

// Write build version
const buildVersion = getMtimeMs(gameSrcPath).toString()
fs.mkdirSync(path.normalize(path.join(buildVersionPath, '..')), {
  recursive: true,
})
fs.writeFileSync(buildVersionPath, buildVersion)
console.log(`build version '${buildVersion}' written to ${buildVersionPath}`)

esbuild.buildSync({
  bundle: true,
  entryPoints: [path.join(gameSrcPath, 'server', 'main.ts')],
  outdir: serverBuildOutputPath,
  platform: 'node',
  sourcemap: true,
  target: 'es2019',
})

// Generate new entrypoint HTML with hardcoded build version
fs.copyFileSync(
  path.join(gameSrcPath, 'client', 'index.html'),
  path.join(serverBuildOutputPath, 'index.html'),
)
