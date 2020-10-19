import * as fs from 'fs'
import * as path from 'path'

import * as Bundler from 'parcel-bundler'

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

const bundler = new Bundler(path.join(gameSrcPath, 'serverMain.ts'), {
  target: 'node',
  // bundleNodeModules: true,
  outDir: serverBuildOutputPath,
  outFile: 'server.js', // The name of the outputFile
  watch: false, // explicitly disable watching...we want the supervisor to control this
  cache: true,
  cacheDir: '.cache',
  minify: false,
  sourceMaps: true,
})

bundler.bundle().then(() => {
  // do nothing
})
