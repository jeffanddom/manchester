import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { vec2, mat2d } from 'gl-matrix'

import { Controls } from '~/tools/particles/Controls'
import { Config } from '~/tools/particles/interfaces'
import { ParticleEmitter } from '~particles/ParticleEmitter'
import { Camera } from '~/Camera'
import * as time from '~/time'
import * as renderable from '~/renderable'

const storage = window.localStorage
const storedConfig = storage.getItem('config')

let globalConfig: Config = storedConfig
  ? JSON.parse(storedConfig)
  : {
      backgroundColor: '#888',
      spawnTtl: 1,
      particleTtl: 1,
      orientation: 0,
      arc: Math.PI,
      particleRate: 120,
      particleRadius: 2,
      particleSpeedMin: 60,
      particleSpeedMax: 240,
      colors: ['#FF4500', '#FFA500', '#FFD700', '#000'],
    }

const updateGlobalConfig = (newConfig: Config) => {
  globalConfig = newConfig
  storage.setItem('config', JSON.stringify(newConfig))
}

const htmlNode = document.getElementById('controls')
ReactDOM.render(
  <Controls
    initialConfig={globalConfig}
    updateGlobalConfig={updateGlobalConfig}
  />,
  htmlNode,
)

// Canvas
const canvas = document.createElement('canvas')
document.body.prepend(canvas)

canvas.width = 400
canvas.height = 400

const camera = new Camera([400, 400], vec2.create(), [400, 400])
camera.setPosition([200, 200])
const ctx = canvas.getContext('2d')

// The emitter
const makeEmitter = () => {
  return new ParticleEmitter({
    position: vec2.fromValues(200, 200),

    spawnTtl: globalConfig.spawnTtl,
    particleTtl: globalConfig.particleTtl,
    orientation: globalConfig.orientation,
    arc: globalConfig.arc,
    particleRadius: globalConfig.particleRadius,
    particleSpeedRange: [
      globalConfig.particleSpeedMin,
      globalConfig.particleSpeedMax,
    ],
    particleRate: globalConfig.particleRate,
    colors: globalConfig.colors,
  })
}

let emitter = makeEmitter()
let prevFrameTime = time.current()

function gameLoop() {
  requestAnimationFrame(gameLoop)

  const now = time.current()
  const dt = now - prevFrameTime
  prevFrameTime = now

  renderable.render(
    ctx,
    {
      type: renderable.Type.RECT,
      fillStyle: globalConfig.backgroundColor,
      floor: false,
      pos: vec2.fromValues(0, 0),
      dimensions: vec2.fromValues(canvas.width, canvas.height),
    },
    mat2d.identity(mat2d.create()),
  )

  emitter.update(dt)
  emitter.render(ctx, camera)

  if (emitter.dead) {
    emitter = makeEmitter()
  }
}

gameLoop()
