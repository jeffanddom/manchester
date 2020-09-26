import * as fs from 'fs'

import * as Koa from 'koa'
import * as KoaRouter from 'koa-router'
import * as koaSend from 'koa-send'

import { buildkeyPath, clientBuildPath, clientEntrypointPath } from './common'

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
    koaSend(ctx, ctx.path, { root: clientBuildPath }),
  )

console.log(`Starting dev server on port ${port}`)
app.use(router.routes()).use(router.allowedMethods())
app.listen(port)
