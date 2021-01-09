import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

import {
  buildVersionPath,
  gameSrcPath,
  serverOutputPath,
  webEntrypoints,
} from './common'

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
  outdir: serverOutputPath,
  platform: 'node',
  sourcemap: true,
  target: 'es2019',
})

// Generate new entrypoint HTML with hardcoded build version
Promise.all(
  webEntrypoints.map(async (srcPath) => {
    await fs.promises.mkdir(path.join(serverOutputPath, srcPath), {
      recursive: true,
    })
    await fs.promises.copyFile(
      path.join(gameSrcPath, srcPath, 'index.html'),
      path.join(serverOutputPath, srcPath, 'index.html'),
    )
  }),
)
