import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

import { buildClient } from './buildClient'
import { gameSrcPath } from './common'

let server: ChildProcessWithoutNullStreams

const trimNewlineSuffix = (data: Buffer): Buffer => {
  if (data[data.length - 1] === 10) {
    return data.subarray(0, data.length - 1)
  }
  return data
}

const startServer = async () => {
  await buildClient()

  if (server) {
    server.kill()
  }

  server = spawn('npx', [
    'ts-node',
    path.join(gameSrcPath, 'gameService', 'serve.ts'),
  ])
  server.stdout.on('data', (data) =>
    console.log(trimNewlineSuffix(data).toString()),
  )
  server.stderr.on('data', (data) =>
    console.log(trimNewlineSuffix(data).toString()),
  )
}

let debounce = false
fs.watch(gameSrcPath, { recursive: true }, async () => {
  if (debounce) {
    return
  }

  setTimeout(() => {
    startServer()
    debounce = false
  }, 1000)
})

startServer()
