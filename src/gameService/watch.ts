import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

import { gameSrcPath, serverBuildOutputPath } from './common'

// Removes a newline from the end of a buffer, if it exists.
const trimNewlineSuffix = (data: Buffer): Buffer => {
  if (data[data.length - 1] === 10) {
    return data.subarray(0, data.length - 1)
  }
  return data
}

// global watch state
let building = false // a single-thread mutex around rebuild()
let buildQueued = false
let server: ChildProcessWithoutNullStreams

const rebuild = async () => {
  // don't allow rebuild() to be called more than once
  if (building) {
    buildQueued = true
    return
  }

  building = true

  // Rebuild client artifacts
  const clientBuild = new Promise((resolve) => {
    const build = spawn('npx', [
      'ts-node',
      path.join(gameSrcPath, 'gameService', 'buildClient.ts'),
    ])
    build.on('close', resolve)
    build.stdout.on('data', (data) =>
      console.log('client build: ' + trimNewlineSuffix(data).toString()),
    )
    build.stderr.on('data', (data) =>
      console.log('client build err: ' + trimNewlineSuffix(data).toString()),
    )
  })

  const serverBuild = new Promise((resolve) => {
    const build = spawn('npx', [
      'ts-node',
      path.join(gameSrcPath, 'gameService', 'buildServer.ts'),
    ])
    build.on('close', resolve)
    build.stdout.on('data', (data) =>
      console.log('server build: ' + trimNewlineSuffix(data).toString()),
    )
    build.stderr.on('data', (data) =>
      console.log('server build err: ' + trimNewlineSuffix(data).toString()),
    )
  })

  await Promise.all([clientBuild, serverBuild])

  // Restart server
  if (server) {
    server.kill()
  }

  server = spawn('npx', ['node', path.join(serverBuildOutputPath, 'server.js')])
  server.stdout.on('data', (data) =>
    console.log(trimNewlineSuffix(data).toString()),
  )
  server.stderr.on('data', (data) =>
    console.log(trimNewlineSuffix(data).toString()),
  )

  // allow rebuild() to be called again
  building = false

  // Immediately trigger a rebuild if one was requested during this build.
  if (buildQueued) {
    buildQueued = false
    rebuild()
  }
}

let debounce = false
const ignore = new Set([
  'gameService/buildkey.ts', // this file is modified by the build process itself
])
fs.watch(gameSrcPath, { recursive: true }, (_event, filename) => {
  if (ignore.has(filename)) {
    return
  }

  if (debounce) {
    return
  }

  debounce = true

  setTimeout(() => {
    debounce = false
    rebuild()
  }, 500)
})

rebuild()
