import * as fs from 'fs'
import * as path from 'path'

import Koa from 'koa'
import KoaRouter from 'koa-router'
import koaSend from 'koa-send'
import * as WebSocket from 'ws'

import {
  buildkeyPath,
  clientBuildOutputPath,
  serverBuildOutputPath,
} from '~/cli/build/common'
import { updateEntrypointHtmlForAutoReload } from '~/client/autoReload'
import { SIMULATION_PERIOD_S } from '~/constants'
import { ClientConnectionWs } from '~/network/ClientConnection'
import { Server as GameServer } from '~/server/Server'

// TODO: read from envvar
const playerCount = 1
const clientBufferSize = 7

let gameServer = new GameServer({
  playerCount,
  minFramesBehindClient: clientBufferSize,
})

setInterval(
  () => gameServer.update(SIMULATION_PERIOD_S),
  (1000 * SIMULATION_PERIOD_S) / 2,
)

const httpServer = new Koa()
const port = 3000

const buildkey = fs.readFileSync(buildkeyPath).toString()
const entrypointPage = fs
  .readFileSync(path.join(clientBuildOutputPath, 'index.html'))
  .toString('utf8')
const entrypointWithAutoReload = updateEntrypointHtmlForAutoReload({
  buildkey,
  html: entrypointPage,
})

const wsServer = new WebSocket.Server({ noServer: true })
const apiRouter = new KoaRouter()
apiRouter
  .get('/buildkey', async (ctx) => (ctx.body = buildkey))
  .get('/restart', async (ctx) => {
    console.log('restarting game server')
    gameServer.shutdown()
    gameServer = new GameServer({
      playerCount,
      minFramesBehindClient: clientBufferSize,
    })
    ctx.body = 'ok'
  })
  .get('/connect', async (ctx) => {
    if (ctx.get('Upgrade') !== 'websocket') {
      ctx.throw(400, 'invalid websocket connection request')
    }

    ctx.respond = false

    const socket = await new Promise((resolve: (ws: WebSocket) => void) => {
      wsServer.handleUpgrade(ctx.req, ctx.req.socket, Buffer.alloc(0), resolve)
    })

    console.log(
      `websocket connection established with ${ctx.req.socket.remoteAddress}`,
    )

    gameServer.connectClient(new ClientConnectionWs(socket))
  })

const router = new KoaRouter()
router.use('/api', apiRouter.routes())
router
  .get('/', async (ctx, next) => {
    ctx.body = entrypointWithAutoReload
    return await next()
  })
  // FIXME: this route catches requests with the `/api` prefix that apiRouter
  // doesn't handle. This is suprising and weird.
  .get('/(.*)', async (ctx) =>
    koaSend(ctx, ctx.path, {
      root: clientBuildOutputPath,
    }),
  )

console.log(`Starting dev server on port ${port}, buildkey ${buildkey}`)
httpServer.use(router.routes()).use(router.allowedMethods())
httpServer.listen(port)
