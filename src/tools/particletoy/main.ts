import { mat4, vec4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'

import { Camera } from './Camera'
import * as models from './models'

import { Renderer3d, UnlitObject, UnlitObjectType } from '~/renderer/Renderer3d'
import { inverseLerp, lerp } from '~/util/math'
import * as autoReload from '~/web/autoReload'

const canvas = document.getElementById('renderer') as HTMLCanvasElement
const gl = canvas.getContext('webgl2')!
const pixelRatio = window.devicePixelRatio

canvas.width = canvas.parentElement!.clientWidth * pixelRatio
canvas.height = canvas.parentElement!.clientHeight * pixelRatio

const renderer = new Renderer3d(gl)
models.load(renderer)

window.addEventListener('resize', () => {
  canvas.width = canvas.parentElement!.clientWidth * pixelRatio
  canvas.height = canvas.parentElement!.clientHeight * pixelRatio
  renderer.syncViewportDimensions()
})

const camera = new Camera(canvas)

const axes: UnlitObject[] = []
for (let axis = 0; axis < 3; axis++) {
  const pos = new Float32Array([0, 0, 0, 0, 0, 0])
  const color = vec4.fromValues(0, 0, 0, 1)

  // positive axis
  pos[3 + axis] = 1000
  color[axis] = 0.75
  axes.push({
    type: UnlitObjectType.Lines,
    positions: pos.slice(),
    color: vec4.clone(color),
  })

  // negative axis
  pos[3 + axis] *= -1
  color[3] = 0.4
  axes.push({
    type: UnlitObjectType.Lines,
    positions: pos.slice(),
    color: vec4.clone(color),
  })
}

const tris = 10000

const vao = renderer.gl.createVertexArray()
renderer.gl.bindVertexArray(vao)

const posBuffer = renderer.gl.createBuffer()
renderer.gl.bindBuffer(renderer.gl.ARRAY_BUFFER, posBuffer)
renderer.gl.bufferData(
  renderer.gl.ARRAY_BUFFER,
  // prettier-ignore
  new Float32Array([
    0, 0.5, 0,
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
  ]),
  renderer.gl.STATIC_DRAW,
)
renderer.gl.enableVertexAttribArray(0)
renderer.gl.vertexAttribPointer(0, 3, renderer.gl.FLOAT, false, 0, 0)

const colorBuffer = renderer.gl.createBuffer()
renderer.gl.bindBuffer(renderer.gl.ARRAY_BUFFER, colorBuffer)
renderer.gl.bufferData(
  renderer.gl.ARRAY_BUFFER,
  // prettier-ignore
  new Float32Array([
    0, 1, 1, 1,
    1, 0, 1, 1
  ]),
  renderer.gl.STATIC_DRAW,
)
renderer.gl.enableVertexAttribArray(1)
renderer.gl.vertexAttribPointer(1, 4, renderer.gl.FLOAT, false, 0, 0)
renderer.gl.vertexAttribDivisor(1, tris / 2)

const xforms: mat4[] = []
for (let i = 0; i < tris; i++) {
  xforms.push(
    mat4.scale(
      mat4.create(),
      mat4.translate(
        mat4.create(),
        mat4.create(),
        vec3.fromValues(
          lerp(-5, 5, Math.random()),
          lerp(-5, 5, Math.random()),
          lerp(-5, 5, Math.random()),
        ),
      ),
      vec3.fromValues(0.1, 0.1, 0.1),
    ),
  )
}

const xformData = new Float32Array(16 * xforms.length)
for (let i = 0; i < xforms.length; i++) {
  for (let j = 0; j < 16; j++) {
    xformData[i * 16 + j] = xforms[i][j]
  }
}

const model2WorldBuffer = renderer.gl.createBuffer()
renderer.gl.bindBuffer(renderer.gl.ARRAY_BUFFER, model2WorldBuffer)
renderer.gl.bufferData(
  renderer.gl.ARRAY_BUFFER,
  xformData,
  renderer.gl.DYNAMIC_DRAW,
)

for (let i = 0; i < 4; i++) {
  const attribLoc = 2 + i
  renderer.gl.enableVertexAttribArray(attribLoc)
  renderer.gl.vertexAttribPointer(
    attribLoc,
    4,
    renderer.gl.FLOAT,
    false,
    64,
    i * 16,
  )
  renderer.gl.vertexAttribDivisor(attribLoc, 1)
}

function update(): void {
  requestAnimationFrame(update)

  renderer.clear(0.5, 0.5, 0.5)
  renderer.setWvTransform(camera.world2View(mat4.create()))

  for (let i = 0; i < xforms.length; i++) {
    mat4.rotateZ(
      xforms[i],
      xforms[i],
      lerp(0.1, 1, inverseLerp(0, xforms.length, i)),
    )
  }

  for (let j = 0; j < 16; j++) {
    for (let i = 0; i < xforms.length; i++) {
      xformData[i * 16 + j] = xforms[i][j]
    }
  }

  renderer.gl.bindVertexArray(vao)
  renderer.gl.bindBuffer(renderer.gl.ARRAY_BUFFER, model2WorldBuffer)
  renderer.gl.bufferSubData(renderer.gl.ARRAY_BUFFER, 0, xformData)

  renderer.useShader('particle')
  renderer.gl.drawArraysInstanced(renderer.gl.TRIANGLES, 0, 3, xforms.length)

  renderer.renderUnlit(axes)
}

requestAnimationFrame(update)
autoReload.poll(1000)
