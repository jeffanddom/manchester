import * as fs from 'fs'
import * as path from 'path'

import Koa from 'koa'
import KoaRouter from 'koa-router'
import koaSend from 'koa-send'
import * as WebSocket from 'ws'

import { buildkey } from '~/build/buildkey'
import { clientBuildOutputPath } from '~/build/common'
import { SIMULATION_PERIOD_S } from '~/constants'
import { Server as GameServer } from '~/Server'

const gameServer = new GameServer()
let serverFrame = 0
setInterval(() => {
  gameServer.update(SIMULATION_PERIOD_S, serverFrame)
  serverFrame++
}, 1000 * SIMULATION_PERIOD_S)

const httpServer = new Koa()
const port = 3000

const entrypointPage = fs
  .readFileSync(path.join(clientBuildOutputPath, 'index.html'))
  .toString('utf8')
const entrypointWithHotReload = entrypointPage.replace(
  '<!-- DEV SERVER HOT RELOAD PLACEHOLDER -->',
  `
<script>
  window.buildkey = '${buildkey}'
  console.log('buildkey: ' + window.buildkey)
  window.hotReload.poll(window.buildkey)
</script>
`,
)

const wsServer = new WebSocket.Server({ noServer: true })
const router = new KoaRouter()
let nextPlayerNumber = 1

router
  .get('/', async (ctx, next) => {
    ctx.body = entrypointWithHotReload
    return await next()
  })
  .get('/client/(.*)', async (ctx) =>
    koaSend(ctx, ctx.path.substr('/client/'.length), {
      root: clientBuildOutputPath,
    }),
  )
  .get('/api/buildkey', async (ctx) => (ctx.body = buildkey))
  .get('/api/connect', async (ctx) => {
    if (ctx.get('Upgrade') !== 'websocket') {
      ctx.throw(400, 'invalid websocket connection request')
    }

    ctx.respond = false
    const socket = await new Promise((resolve: (ws: WebSocket) => void) => {
      wsServer.handleUpgrade(
        ctx.req,
        ctx.request.socket,
        Buffer.alloc(0),
        resolve,
      )
    })

    console.log(
      `websocket connection established with ${ctx.req.socket.remoteAddress}, assigning player number ${nextPlayerNumber}`,
    )

    socket.send(nextPlayerNumber.toString())
    nextPlayerNumber++
  })

console.log(`Starting dev server on port ${port}, buildkey ${buildkey}`)
httpServer.use(router.routes()).use(router.allowedMethods())
httpServer.listen(port)
