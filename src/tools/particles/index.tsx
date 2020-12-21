import { mat2d, vec2 } from 'gl-matrix'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Renderer2d } from '~/renderer/Renderer2d'
import { Controls } from '~/tools/particles/Controls'
import { Config } from '~/tools/particles/interfaces'
import * as time from '~/util/time'

const storage = window.localStorage
const storedConfig = storage.getItem('config')

let globalConfig: Config =
  storedConfig !== null
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

const renderer: Renderer2d = new Renderer2d(canvas)
renderer.setTransform(
  mat2d.fromTranslation(mat2d.create(), vec2.fromValues(200, 200)),
)

// The emitter
const makeEmitter = () => {
  return new ParticleEmitter({
    position: vec2.fromValues(0, 0),

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

  emitter.update(dt)

  renderer.clear()
  emitter.getRenderables().forEach((r) => renderer.render(r))

  if (emitter.dead) {
    emitter = makeEmitter()
  }
}

gameLoop()
