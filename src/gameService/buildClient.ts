import * as path from 'path'

import * as Bundler from 'parcel-bundler'

import { clientBuildPath, gameSrcPath } from './common'

console.log('Creating bundle...')

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

bundler.bundle().then(() => {
  // do nothing
})
