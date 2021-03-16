import { mat4, vec4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'

import { Camera } from './Camera'

import {
  ArrayDataType,
  BufferConfig,
  MeshBuffer,
  MeshPrimitive,
  NumericArray,
} from '~/renderer/interfaces'
import { Renderer3d, UnlitObject, UnlitObjectType } from '~/renderer/Renderer3d'
import { ShaderAttrib } from '~/renderer/shaders/common'
import { inverseLerp, lerp } from '~/util/math'
import * as autoReload from '~/web/autoReload'

const canvas = document.getElementById('renderer') as HTMLCanvasElement
const gl = canvas.getContext('webgl2')!
const pixelRatio = window.devicePixelRatio

canvas.width = canvas.parentElement!.clientWidth * pixelRatio
canvas.height = canvas.parentElement!.clientHeight * pixelRatio

const renderer = new Renderer3d(gl)

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

const attribBuffers: Map<number, MeshBuffer> = new Map()
attribBuffers.set(ShaderAttrib.Position, {
  // prettier-ignore
  bufferData: new Float32Array([
    0, 0.5, 0,
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
  ]),
  componentsPerAttrib: 3,
})

const instanceAttribBufferConfig: Map<number, BufferConfig> = new Map()

instanceAttribBufferConfig.set(ShaderAttrib.InstanceColor, {
  arrayType: ArrayDataType.Float,
  componentsPerAttrib: 4,
})

instanceAttribBufferConfig.set(ShaderAttrib.InstanceColor, {
  arrayType: ArrayDataType.Float,
  componentsPerAttrib: 4,
})

instanceAttribBufferConfig.set(ShaderAttrib.InstanceTransform, {
  arrayType: ArrayDataType.Float,
  componentsPerAttrib: 4,
  attribSlots: 4,
})

// prettier-ignore
const colors = new Float32Array([
  0, 1, 1, 1,
  1, 0, 1, 1
])

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

const dataMesh = {
  primitive: MeshPrimitive.Triangles,
  vertsPerInstance: 3,
  attribBuffers,
  instanceAttribBufferConfig,
}

renderer.loadParticleMesh('default', dataMesh, tris)

function update(): void {
  requestAnimationFrame(update)

  renderer.clear(0.5, 0.5, 0.5)
  renderer.setWvTransform(camera.world2View(mat4.create()))

  renderer.renderUnlit(axes)

  for (let i = 0; i < xforms.length; i++) {
    mat4.rotateZ(
      xforms[i],
      xforms[i],
      lerp(0.1, 1, inverseLerp(0, xforms.length, i)),
    )
  }

  for (let i = 0; i < xforms.length; i++) {
    for (let j = 0; j < 16; j++) {
      xformData[i * 16 + j] = xforms[i][j]
    }
  }

  const attribUpdates: Map<number, NumericArray> = new Map()
  attribUpdates.set(ShaderAttrib.InstanceColor, colors)
  attribUpdates.set(ShaderAttrib.InstanceTransform, xformData)

  renderer.renderParticles('default', attribUpdates, tris)
}

requestAnimationFrame(update)
autoReload.poll(1000)
