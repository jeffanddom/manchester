import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { vec2 } from 'gl-matrix'

// import { ParticleEmitter } from '~/particles/ParticleEmitter'
import { Controls } from '~/tools/particles/Controls'
import { Config } from '~/tools/particles/interfaces'
import { ParticleEmitter } from '~particles/ParticleEmitter'
import { Camera } from '~/Camera'

let globalConfig: Config = {
  backgroundColor: '#888',
  emitterLifespan: 1000,
  particleLifespan: 1000,
  orientation: 0,
  arc: Math.PI,
}

const updateGlobalConfig = (newConfig: Config) => {
  globalConfig = newConfig
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
    particleRadius: 10,
    particleSpeedRange: [1.5, 2.5],
    particleRate: 4.5,
    colors: ['#FF4500', '#FFA500', '#FFD700', '#000'],
  })
}
let emitter = makeEmitter()

let emitterLastStart = Date.now()
function gameLoop() {
  requestAnimationFrame(gameLoop)

  ctx.fillStyle = globalConfig.backgroundColor
  ctx.fillRect(0, 0, 400, 400)

  emitter.update()
  emitter.render(ctx, camera)

  if (emitter.dead) {
    emitter = makeEmitter()
    emitterLastStart = Date.now()
  }
}

gameLoop()
