import * as fs from 'fs'
import * as path from 'path'

import * as Bundler from 'parcel-bundler'

import { buildkeyPath, clientBuildPath, gameSrcPath } from './common'

function getMtimeMs(filepath: string): number {
  const stats = fs.statSync(filepath)
  if (stats.isDirectory()) {
    const files = fs.readdirSync(filepath)
    const mtimes = files.map((f) => getMtimeMs(path.join(filepath, f)))
    return mtimes.reduce((accum, t) => Math.max(accum, t), -1)
  }

  return stats.mtimeMs
}

export const buildClient = async (): Promise<void> => {
  // Initializes a bundler using the entrypoint location and options provided
  const bundler = new Bundler(path.join(gameSrcPath, 'index.html'), {
    outDir: clientBuildPath,
    outFile: 'index.html', // The name of the outputFile
    publicUrl: '/client',
    watch: false, // explicitly disable watching...we want the supervisor to control this
    cache: true,
    cacheDir: '.cache',
    minify: false,
    target: 'browser', // Browser/node/electron, defaults to browser
    sourceMaps: true,
  })

  // Run the bundler, this returns the main bundle
  // Use the events if you're using watch mode as this promise will only trigger once and not for every rebuild
  await bundler.bundle()

  // if no build key is provided via the command line, write a build key
  const buildkey = getMtimeMs(gameSrcPath)
  const fd = fs.openSync(buildkeyPath, 'w')
  fs.writeSync(fd, Buffer.from(buildkey.toString()))
}
