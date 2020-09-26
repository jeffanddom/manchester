import * as fs from 'fs'

import * as Koa from 'koa'
import * as KoaRouter from 'koa-router'
import * as koaSend from 'koa-send'
import * as WebSocket from 'ws'

import { buildkeyPath, clientEntrypointPath } from './common'

const app = new Koa()
const port = 3000

const buildkey = fs.readFileSync(buildkeyPath).toString('utf8')
console.log(`initial buildkey is ${buildkey}`)

const entrypointPage = fs.readFileSync(clientEntrypointPath).toString('utf8')
const entrypointWithHotReload = entrypointPage.replace(
  '<!-- DEV SERVER HOT RELOAD PLACEHOLDER -->',
  `<script>window.initHotReload('${buildkey}')</script>`,
)

const wsServer = new WebSocket.Server({ noServer: true })

const router = new KoaRouter()
let nextPlayerNumber = 1
router
  .get('/', async (ctx, next) => {
    ctx.body = entrypointWithHotReload
    return await next()
  })
  .get('/buildkey', async (ctx, next) => {
    ctx.body = buildkey
    return await next()
  })
  .get('/clientBuild/(.*)', async (ctx) =>
    koaSend(ctx, ctx.path, { root: __dirname }),
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

console.log(`Starting dev server on port ${port}`)
app.use(router.routes()).use(router.allowedMethods())

app.listen(port)
