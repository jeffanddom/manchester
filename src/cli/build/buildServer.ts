import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

import { buildkeyPath, gameSrcPath, serverBuildOutputPath } from './common'

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

// Write build key
const buildkey = getMtimeMs(gameSrcPath).toString()
fs.mkdirSync(path.normalize(path.join(buildkeyPath, '..')), { recursive: true })
fs.writeFileSync(buildkeyPath, buildkey)
console.log(`buildkey '${buildkey}' written to ${buildkeyPath}`)

esbuild.buildSync({
  bundle: true,
  entryPoints: [path.join(gameSrcPath, 'server', 'main.ts')],
  outdir: serverBuildOutputPath,
  platform: 'node',
  sourcemap: true,
  target: 'es2019',
})
