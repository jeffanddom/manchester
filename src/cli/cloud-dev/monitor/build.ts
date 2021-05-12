/**
 * Build script for Lambda-ready .zip file.
 */

import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

import * as esbuild from 'esbuild'

async function main(): Promise<void> {
  const entrypoint = path.join(__dirname, 'index.ts')
  const outdir = path.join(__dirname, 'out')
  const archive = path.join(__dirname, 'cloud-dev-monitor.zip')

  fs.rmSync(outdir, { force: true, recursive: true })

  await esbuild.build({
    bundle: true,
    entryPoints: [entrypoint],
    outdir,
    platform: 'node',
    target: 'es2019',
  })

  fs.rmSync(archive, { force: true })
  child_process.execSync(`zip -j "${archive}" "${outdir}"${path.sep}*`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
