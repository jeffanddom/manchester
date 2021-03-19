import { mat4, vec4 } from 'gl-matrix'
import { vec3 } from 'gl-matrix'
import { quat } from 'gl-matrix'

import { Camera } from './Camera'
// import { WebGLDebugUtils } from './webgl-debug'

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

// function logGLCall(functionName: string, args: unknown): void {
//   console.log(
//     'gl.' +
//       functionName +
//       '(' +
//       WebGLDebugUtils.glFunctionArgsToString(functionName, args) +
//       ')',
//   )
// }

const canvas = document.getElementById('renderer') as HTMLCanvasElement

const gl = canvas.getContext('webgl2')!
// const gl = WebGLDebugUtils.makeDebugContext(
//   canvas.getContext('webgl2')!,
//   undefined,
//   logGLCall,
// )

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

const tris = 30000

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

instanceAttribBufferConfig.set(ShaderAttrib.InstanceRotation, {
  arrayType: ArrayDataType.Float,
  componentsPerAttrib: 4,
})

instanceAttribBufferConfig.set(ShaderAttrib.InstanceTranslation, {
  arrayType: ArrayDataType.Float,
  componentsPerAttrib: 3,
})

instanceAttribBufferConfig.set(ShaderAttrib.InstanceScale, {
  arrayType: ArrayDataType.Float,
  componentsPerAttrib: 3,
})

const rotationsData = new Float32Array(4 * tris)
const translationsData = new Float32Array(3 * tris)
const scalesData = new Float32Array(3 * tris)
const colorsData = new Float32Array(4 * tris)

for (let i = 0; i < tris; i++) {
  rotationsData.set(quat.create(), i * 4)
  translationsData.set(
    vec3.fromValues(
      lerp(-10, 10, Math.random()),
      lerp(-10, 10, Math.random()),
      lerp(-10, 10, Math.random()),
    ),
    i * 3,
  )
  scalesData.set(
    vec3.fromValues(
      lerp(0.05, 0.25, Math.random()),
      lerp(0.05, 0.25, Math.random()),
      lerp(0.05, 0.25, Math.random()),
    ),
    i * 3,
  )
  colorsData.set([Math.random(), Math.random(), Math.random(), 1], i * 4)
}

const dataMesh = {
  primitive: MeshPrimitive.Triangles,
  vertsPerInstance: 3,
  attribBuffers,
  instanceAttribBufferConfig,
}

const attribUpdates: Map<number, NumericArray> = new Map()
attribUpdates.set(ShaderAttrib.InstanceColor, colorsData)
attribUpdates.set(ShaderAttrib.InstanceScale, scalesData)
attribUpdates.set(ShaderAttrib.InstanceTranslation, translationsData)

renderer.loadParticleMesh('default', dataMesh, tris)
renderer.updateParticles('default', attribUpdates)

// To avoid allocations, we'll re-use some objects in the update loop.
const tempMat = mat4.create()
const tempQuat = quat.create()
attribUpdates.clear() // we'll re-use this in the looop

function update(): void {
  requestAnimationFrame(update)

  renderer.clear(0.5, 0.5, 0.5)
  renderer.setWvTransform(camera.world2View(tempMat))

  renderer.renderUnlit(axes)

  for (let i = 0; i < tris; i++) {
    quat.set(
      tempQuat,
      rotationsData[i * 4],
      rotationsData[i * 4 + 1],
      rotationsData[i * 4 + 2],
      rotationsData[i * 4 + 3],
    )
    quat.rotateX(tempQuat, tempQuat, lerp(0.05, 0.15, inverseLerp(0, tris, i)))
    quat.rotateY(tempQuat, tempQuat, lerp(0.05, 0.15, inverseLerp(0, tris, i)))
    quat.rotateZ(tempQuat, tempQuat, lerp(0.05, 0.15, inverseLerp(0, tris, i)))
    rotationsData.set(tempQuat, i * 4)
  }

  attribUpdates.set(ShaderAttrib.InstanceRotation, rotationsData)
  renderer.renderParticles('default', tris, attribUpdates)
}

requestAnimationFrame(update)
autoReload.poll(1000)
