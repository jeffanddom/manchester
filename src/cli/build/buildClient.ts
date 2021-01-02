import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

import { clientBuildOutputPath, gameSrcPath } from './common'

console.log('Creating bundle...')

esbuild.buildSync({
  bundle: true,
  entryPoints: [path.join(gameSrcPath, 'client', 'main.ts')],
  loader: {
    '.obj': 'text',
    '.gltf': 'text', // TODO: change to JSON
  },
  minify: false,
  outdir: clientBuildOutputPath,
  sourcemap: true,
  target: ['chrome88', 'firefox84', 'safari14'],
})

fs.copyFileSync(
  path.join(gameSrcPath, 'client', 'index.html'),
  path.join(clientBuildOutputPath, 'index.html'),
)
