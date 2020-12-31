import * as path from 'path'

import * as Bundler from 'parcel-bundler'

import { clientBuildOutputPath, gameSrcPath } from './common'

console.log('Creating bundle...')

const bundler = new Bundler(path.join(gameSrcPath, 'index.html'), {
  outDir: clientBuildOutputPath,
  outFile: 'index.html', // The name of the outputFile
  watch: false, // explicitly disable watching...we want the supervisor to control this
  cache: true,
  cacheDir: '.cache',
  minify: false,
  target: 'browser', // Browser/node/electron, defaults to browser
  sourceMaps: true,
})

for (const ext of ['obj', 'gltf']) {
  bundler.addAssetType(ext, require.resolve('./TextAsset'))
}

bundler.bundle().then(() => {
  // do nothing
})
