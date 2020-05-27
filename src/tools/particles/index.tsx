import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { vec2 } from 'gl-matrix'

import { Controls } from '~/tools/particles/Controls'
import { Config } from '~/tools/particles/interfaces'
import { ParticleEmitter } from '~particles/ParticleEmitter'
import { Camera } from '~/Camera'

const storage = window.localStorage
const storedConfig = storage.getItem('config')

let globalConfig: Config = storedConfig
  ? JSON.parse(storedConfig)
  : {
      backgroundColor: '#888',
      emitterLifespan: 1000,
      particleLifespan: 1000,
      orientation: 0,
      arc: Math.PI,
      particleRate: 2,
      particleRadius: 2,
      particleSpeedMin: 1,
      particleSpeedMax: 4,
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
const ctx = canvas.getContext('2d')

// The emitter
const makeEmitter = () => {
  return new ParticleEmitter({
    position: vec2.fromValues(200, 200),

    emitterLifespan: globalConfig.emitterLifespan,
    particleLifespan: globalConfig.particleLifespan,
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
function gameLoop() {
  requestAnimationFrame(gameLoop)

  ctx.fillStyle = globalConfig.backgroundColor
  ctx.fillRect(0, 0, 400, 400)

  emitter.update()
  emitter.render(ctx, camera)

  if (emitter.dead) {
    emitter = makeEmitter()
  }
}

gameLoop()
