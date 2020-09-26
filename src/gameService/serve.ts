import * as fs from 'fs'
import * as path from 'path'

import * as Koa from 'koa'
import * as KoaRouter from 'koa-router'
import * as koaSend from 'koa-send'
import * as WebSocket from 'ws'

import { buildkeyPath, clientBuildPath } from './common'

const app = new Koa()
const port = 3000

const buildkey = fs.readFileSync(buildkeyPath).toString('utf8')
const entrypointPage = fs
  .readFileSync(path.join(clientBuildPath, 'index.html'))
  .toString('utf8')
const entrypointWithHotReload = entrypointPage.replace(
  '<!-- DEV SERVER HOT RELOAD PLACEHOLDER -->',
  `<script>window.hotReload.poll('${buildkey}')</script>`,
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
    koaSend(ctx, ctx.path.substr('/client/'.length), { root: clientBuildPath }),
  )
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
app.use(router.routes()).use(router.allowedMethods())
app.listen(port)
