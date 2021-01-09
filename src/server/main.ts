import * as fs from 'fs'

import * as hapi from '@hapi/hapi'
import inert from '@hapi/inert'
import * as WebSocket from 'ws'

import { serverBuildVersionPath, webOutputPath } from '~/cli/build/common'
import { SIMULATION_PERIOD_S } from '~/constants'
import { ClientConnectionWs } from '~/network/ClientConnection'
import { ServerSim } from '~/server/ServerSim'

async function buildVersion(): Promise<string> {
  return (await fs.promises.readFile(serverBuildVersionPath)).toString()
}

async function main(): Promise<void> {
  // TODO: read from envvar
  const playerCount = 1
  const clientBufferSize = 7
  const port = 3000

  let gameSim = new ServerSim({
    playerCount,
    minFramesBehindClient: clientBufferSize,
  })

  setInterval(
    () => gameSim.update(SIMULATION_PERIOD_S),
    (1000 * SIMULATION_PERIOD_S) / 2,
  )

  const wsServer = new WebSocket.Server({ noServer: true })
  const httpServer = new hapi.Server({
    port,
    host: 'localhost',
  })

  await httpServer.register(inert)

  httpServer.route({
    method: 'GET',
    path: '/',
    handler: async (req, h) => {
      return h.redirect('/client')
    },
  })

  httpServer.route({
    method: 'GET',
    path: '/api/buildVersion',
    handler: async () => {
      return await buildVersion()
    },
  })

  httpServer.route({
    method: 'GET',
    path: '/api/restart',
    handler: () => {
      console.log('restarting game server')
      gameSim.shutdown()
      gameSim = new ServerSim({
        playerCount,
        minFramesBehindClient: clientBufferSize,
      })
      return ''
    },
  })

  httpServer.route({
    method: 'GET',
    path: '/api/connect',
    handler: async (request, h) => {
      if (request.headers['upgrade'] !== 'websocket') {
        return h
          .response({
            error: 'invalid websocket connection request',
          })
          .code(400)
      }

      const nodeReq = request.raw.req
      const tcpSocket = nodeReq.socket
      const webSocket = await new Promise(
        (resolve: (ws: WebSocket) => void) => {
          wsServer.handleUpgrade(nodeReq, tcpSocket, Buffer.alloc(0), resolve)
        },
      )

      console.log(
        `websocket connection established with ${tcpSocket.remoteAddress}`,
      )

      gameSim.connectClient(new ClientConnectionWs(webSocket))

      // The WebSocket server now controls the socket, so let Hapi stop worrying
      // about it.
      return h.abandon
    },
  })

  // Static assets
  httpServer.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: webOutputPath,
        index: 'index.html',
      },
    },
  })

  const bv = await buildVersion()
  console.log(`Starting dev server on port ${port}, build version ${bv}`)
  await httpServer.start()
}

main()

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})