import * as fs from 'fs'

import * as Koa from 'koa'
import * as KoaRouter from 'koa-router'
import * as koaSend from 'koa-send'
import * as WebSocket from 'ws'

import { buildkeyPath, clientEntrypointPath } from './common'

const websocket = require('koa-easy-ws')

const app = new Koa()
const port = 3000

const buildkey = fs.readFileSync(buildkeyPath).toString('utf8')
console.log(`initial buildkey is ${buildkey}`)

const entrypointPage = fs.readFileSync(clientEntrypointPath).toString('utf8')
const entrypointWithHotReload = entrypointPage.replace(
  '<!-- DEV SERVER HOT RELOAD PLACEHOLDER -->',
  `<script>window.initHotReload('${buildkey}')</script>`,
)

const router = new KoaRouter()
let playerNumber = 1
router
  .get('/', async (ctx, next) => {
    ctx.body = entrypointWithHotReload
    return await next()
  })
  .get('/buildkey', async (ctx, next) => {
    ctx.body = buildkey
    return await next()
  })
  .get('/clientBuild/(.*)', async (ctx) => {
    console.log(ctx.path)
    return koaSend(ctx, ctx.path, { root: __dirname })
  })
  .get('/api/connect', async (ctx) => {
    const ctx2 = ctx as any

    if (ctx2.ws) {
      const ws: WebSocket = await ctx2.ws()

      ws.on('open', () => {
        ws.send(playerNumber.toString())
      })
      ws.on('message', (data) => {
        console.log(data)
      })
      playerNumber++
    }
  })

// .post('/api/connect', async (ctx) => {})
// .post('/api/connect', async (ctx) => {})

console.log(`Starting dev server on port ${port}`)
app.use(websocket()).use(router.routes()).use(router.allowedMethods())

app.listen(port)
