import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

import * as chokidar from 'chokidar'
import * as esbuild from 'esbuild'

import * as time from '../../util/time'

import {
  autoReloadEphemeralPath,
  copyWebHtml,
  gameSrcPath,
  serverBuildOpts,
  serverEntrypoints,
  updateWebBuildVersion,
  webBuildOpts,
  writeServerBuildVersion,
} from './common'

// Removes a newline from the end of a buffer, if it exists.
const trimNewlineSuffix = (data: Buffer): Buffer => {
  if (data[data.length - 1] === 10) {
    return data.subarray(0, data.length - 1)
  }
  return data
}

function getMtimeMs(filepath: string): number {
  const stats = fs.statSync(filepath)
  if (stats.isDirectory()) {
    const files = fs.readdirSync(filepath)
    const mtimes = files.map((f) => getMtimeMs(path.join(filepath, f)))
    return mtimes.reduce((accum, t) => Math.max(accum, t), -1)
  }

  return stats.mtimeMs
}

class DevDaemon {
  private building: boolean
  private buildQueued: boolean

  private servers: ChildProcessWithoutNullStreams[]
  private incrementalBuilds:
    | {
        server: esbuild.BuildIncremental
        web: esbuild.BuildIncremental
      }
    | undefined

  constructor() {
    this.building = false
    this.buildQueued = false
    this.servers = []
  }

  public start(): void {
    let debounce = false

    chokidar
      .watch(gameSrcPath, { ignoreInitial: true, persistent: true })
      .on('all', (_event, filename) => {
        if (filename.startsWith(autoReloadEphemeralPath)) {
          return
        }

        if (debounce) {
          return
        }

        debounce = true

        setTimeout(() => {
          debounce = false
          this.rebuild()
        }, 500)
      })

    this.rebuild()
  }

  private async rebuild(): Promise<void> {
    // don't allow rebuild() to be called more than once
    if (this.building) {
      this.buildQueued = true
      return
    }

    this.building = true
    const buildVersion = getMtimeMs(gameSrcPath).toString()

    console.log(`Spawning build jobs for build version ${buildVersion}...`)
    const start = time.current()

    let buildSuccess = false
    try {
      await this.rebuildAssets(buildVersion)
      buildSuccess = true
    } catch (err) {
      console.log(`asset build error: ${err.toString()}`)
    }

    const elapsed = time.current() - start
    console.log(`Build completed in ${elapsed.toFixed(3)}s`)

    if (buildSuccess) {
      this.restartServer()
    }

    // allow rebuild() to be called again
    this.building = false

    // Immediately trigger a rebuild if one was requested during this build.
    if (this.buildQueued) {
      this.buildQueued = false
      this.rebuild()
    }
  }

  private async rebuildAssets(buildVersion: string): Promise<void> {
    // Make build version available to web build.
    await updateWebBuildVersion(buildVersion)

    if (this.incrementalBuilds !== undefined) {
      await Promise.all([
        this.incrementalBuilds.server.rebuild(),
        this.incrementalBuilds.web.rebuild(),
      ])
    } else {
      const [server, web] = await Promise.all([
        esbuild.build({
          ...serverBuildOpts,
          incremental: true,
        }),
        esbuild.build({
          ...webBuildOpts,
          incremental: true,
        }),
      ])
      this.incrementalBuilds = { server, web }
    }

    // Post-build tasks:
    // - copy index.html for web programs
    // - make build version available to server.
    await Promise.all([copyWebHtml(), writeServerBuildVersion(buildVersion)])
  }

  private restartServer(): void {
    for (const server of this.servers) {
      server.kill()
    }
    this.servers = []

    for (const entrypoint of serverEntrypoints) {
      const server = spawn('node', [entrypoint.bundlePath])
      server.stdout.on('data', (data) =>
        console.log(trimNewlineSuffix(data).toString()),
      )
      server.stderr.on('data', (data) =>
        console.log(trimNewlineSuffix(data).toString()),
      )
      this.servers.push(server)
    }
  }
}

const daemon = new DevDaemon()
daemon.start()
