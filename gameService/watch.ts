import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import * as fs from 'fs'

import { buildClient } from './buildClient'

let server: ChildProcessWithoutNullStreams

const startServer = async () => {
  await buildClient()

  if (server) {
    server.kill()
  }

  server = spawn('yarn', ['devServe'])
  server.stdout.on('data', (data) => console.log(data.toString()))
  server.stderr.on('data', (data) => console.log(data.toString()))
}

fs.watch(
  __dirname + '/../src',
  { recursive: true },
  async (_eventType, _filename) => {
    startServer()
  },
)

startServer()
