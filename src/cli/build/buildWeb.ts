import * as path from 'path'

import * as esbuild from 'esbuild'

import { gameSrcPath, webEntrypoints, webOutputPath } from './common'

console.log('Creating bundle...')

esbuild.buildSync({
  bundle: true,
  entryPoints: webEntrypoints.map((srcPath) =>
    path.join(gameSrcPath, srcPath, 'main.ts'),
  ),
  loader: {
    '.obj': 'text',
    '.gltf': 'json',
  },
  minify: false,
  outdir: webOutputPath,
  sourcemap: true,
  target: ['chrome88', 'firefox84', 'safari14'],
})
