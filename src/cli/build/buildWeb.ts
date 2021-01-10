import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

import {
  gameSrcPath,
  webEntrypoints,
  webEphemeralPath,
  webOutputPath,
} from './common'

let buildVersion = '(none)'
if (process.argv.length > 2) {
  buildVersion = process.argv[2]
}

console.log(`Creating bundle for build version ${buildVersion}...`)

// Write build version
fs.mkdirSync(webEphemeralPath, { recursive: true })
fs.writeFileSync(
  path.join(webEphemeralPath, 'buildVersion.ts'),
  `export const buildVersion = '${buildVersion}'`,
)

esbuild.buildSync({
  bundle: true,
  define: {
    'process.env.NODE_ENV': '"production"', // for react-dom
  },
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

// Copy index.html files
Promise.all(
  webEntrypoints.map(async (srcPath) => {
    await fs.promises.mkdir(path.join(webOutputPath, srcPath), {
      recursive: true,
    })
    await fs.promises.copyFile(
      path.join(gameSrcPath, srcPath, 'index.html'),
      path.join(webOutputPath, srcPath, 'index.html'),
    )
  }),
)
