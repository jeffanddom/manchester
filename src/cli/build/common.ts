import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

const findProjectRoot = (): string => {
  let dir = __dirname
  while (dir.length > 1) {
    if (fs.readdirSync(dir).indexOf('package.json') >= 0) {
      return dir
    }
    dir = path.dirname(dir)
  }
  throw new Error(`project root not found when searching from ${__dirname}`)
}

export const projectRootPath = findProjectRoot()
export const gameSrcPath = path.join(projectRootPath, 'src')
export const buildOutputPath = path.join(projectRootPath, 'out')
export const webOutputPath = path.join(buildOutputPath, 'web')
export const serverOutputPath = path.join(buildOutputPath, 'server')
export const webEphemeralPath = path.join(gameSrcPath, 'web', 'ephemeral')
export const serverBuildVersionPath = path.join(
  serverOutputPath,
  'buildVersion',
)

export const webEntrypoints = [
  ['client', 'main.ts'],
  ['tools/particletoy', 'main.ts'],
  ['tools/particletoy', 'webgl-debug.js'],
  ['tools/rendertoy', 'main.ts'],
  ['tools/bench', 'main.tsx'],
]

export const webBuildOpts: esbuild.BuildOptions = {
  bundle: true,
  define: {
    'process.env.NODE_ENV': '"production"', // for react-dom
  },
  entryPoints: webEntrypoints.map(([dir, entryfile]) =>
    path.join(gameSrcPath, dir, entryfile),
  ),
  loader: {
    '.obj': 'text',
    '.gltf': 'json',
  },
  minify: false,
  outdir: webOutputPath,
  sourcemap: true,
  target: ['chrome88', 'firefox84', 'safari14'],
}

export const serverBuildOpts: esbuild.BuildOptions = {
  bundle: true,
  entryPoints: [path.join(gameSrcPath, 'server', 'main.ts')],
  outdir: serverOutputPath,
  platform: 'node',
  sourcemap: true,
  target: 'es2019',
}

export async function updateWebBuildVersion(
  buildVersion: string,
): Promise<void> {
  await fs.promises.mkdir(webEphemeralPath, { recursive: true })
  await fs.promises.writeFile(
    path.join(webEphemeralPath, 'buildVersion.ts'),
    `export const buildVersion = '${buildVersion}'`,
  )
}

export async function copyWebHtml(): Promise<void> {
  await Promise.all(
    webEntrypoints.map(async ([dir]) => {
      await fs.promises.mkdir(path.join(webOutputPath, dir), {
        recursive: true,
      })
      await fs.promises.copyFile(
        path.join(gameSrcPath, dir, 'index.html'),
        path.join(webOutputPath, dir, 'index.html'),
      )
    }),
  )
}

export async function writeServerBuildVersion(
  buildVersion: string,
): Promise<void> {
  await fs.promises.mkdir(
    path.normalize(path.join(serverBuildVersionPath, '..')),
    {
      recursive: true,
    },
  )
  await fs.promises.writeFile(serverBuildVersionPath, buildVersion)
}
