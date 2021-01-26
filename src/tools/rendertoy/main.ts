import CodeMirror from 'codemirror'
import { mat4, quat, vec2, vec3, vec4 } from 'gl-matrix'

import { getGltfDocument } from '~/assets/models'
import {
  triModelAddEdgeOn,
  triModelToWiresolidLineModel,
} from '~/renderer/geometryUtils'
import * as gltf from '~/renderer/gltf'
import { MeshPrimitive, ModelNode } from '~/renderer/interfaces'
import {
  FragmentShaderError,
  Renderer3d,
  ShaderLinkError,
  VertexShaderError,
  WireObject,
} from '~/renderer/Renderer3d'
import { shader as solidShader } from '~/renderer/shaders/solid'
import { shader as wiresolidShader } from '~/renderer/shaders/wiresolid'
import { Camera } from '~/tools/rendertoy/Camera'
import * as time from '~/util/time'
import * as autoReload from '~/web/autoReload'

import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/clike/clike.js'

type RenderMode = 'solid' | 'wiresolid' | 'wiresolidLine'
type Shader = 'solid' | 'wiresolid'

const shaders: Record<
  Shader,
  {
    vertexSrc: string
    fragmentSrc: string
    attribs: string[]
    uniforms: string[]
  }
> = {
  solid: solidShader,
  wiresolid: wiresolidShader,
}

let currentRenderMode: RenderMode = 'solid'
let currentShader: Shader = 'solid'
function setCurrentRenderMode(mode: RenderMode): void {
  const shadersByMode: Record<RenderMode, Shader> = {
    solid: 'solid',
    wiresolid: 'wiresolid',
    wiresolidLine: 'solid',
  }

  currentRenderMode = mode
  currentShader = shadersByMode[mode]
}

switch (
  (document.querySelector('#controls input:checked') as HTMLInputElement).value
) {
  case 'solid':
    setCurrentRenderMode('solid')
    break
  case 'wiresolid':
    setCurrentRenderMode('wiresolid')
    break
  case 'wiresolidLine':
    setCurrentRenderMode('wiresolidLine')
    break
}

if (
  (document.querySelector('#controls input:checked') as HTMLInputElement)
    .value === 'wiresolid'
) {
  setCurrentRenderMode('wiresolid')
}

// Setup shader editors
const codeMirrorOptions: CodeMirror.EditorConfiguration = {
  mode: 'clike', // there is no GLSL built-in mode, but clike comes closest
  theme: 'monokai',
  lineNumbers: true,
  lineWrapping: true,
  tabSize: 2,
  indentWithTabs: false,
}

const vsEditor = CodeMirror(document.getElementById('editor-vs')!, {
  ...codeMirrorOptions,
  value: shaders[currentShader].vertexSrc,
})

const fsEditor = CodeMirror(document.getElementById('editor-fs')!, {
  ...codeMirrorOptions,
  value: shaders[currentShader].fragmentSrc,
})

let lastCodeUpdate: number | undefined
vsEditor.on('change', () => (lastCodeUpdate = time.current()))
fsEditor.on('change', () => (lastCodeUpdate = time.current()))

const canvas = document.getElementById('renderer') as HTMLCanvasElement
canvas.width = canvas.parentElement!.clientWidth
canvas.height = canvas.parentElement!.clientHeight

const modelControls = document.getElementById('controls')
modelControls?.addEventListener('change', (e) => {
  const value = (e.target! as HTMLInputElement).value
  setCurrentRenderMode(value as RenderMode)

  vsEditor.setValue(shaders[currentShader].vertexSrc)
  fsEditor.setValue(shaders[currentShader].fragmentSrc)
})

const renderer = new Renderer3d(canvas)

// renderer.loadModel('model', triModelAddEdgeOn(cubeModel()))
const modelNode = gltf.getModels(getGltfDocument('tank'))[0]
renderer.loadModel('model', triModelAddEdgeOn(modelNode))
renderer.loadModel('model-line', triModelToWiresolidLineModel(modelNode))

window.addEventListener('resize', () => {
  canvas.width = canvas.parentElement!.clientWidth
  canvas.height = canvas.parentElement!.clientHeight
  renderer.setViewportDimensions(vec2.fromValues(canvas.width, canvas.height))
})

const camera = new Camera(canvas)

function recompile(): void {
  try {
    renderer.loadShader(
      currentShader,
      {
        ...shaders[currentShader],
        vertexSrc: vsEditor.getValue(),
        fragmentSrc: fsEditor.getValue(),
      },
      { allowOverride: true },
    )
  } catch (err) {
    if (
      err instanceof VertexShaderError ||
      err instanceof FragmentShaderError ||
      err instanceof ShaderLinkError
    ) {
      console.log(err.toString())
    } else {
      throw err
    }
  }
}

const axes: WireObject[] = []
for (let axis = 0; axis < 3; axis++) {
  const pos = new Float32Array([0, 0, 0, 0, 0, 0])
  const color = vec4.fromValues(0, 0, 0, 1)

  // positive axis
  pos[3 + axis] = 1000
  color[axis] = 0.75
  axes.push({
    type: 'LINES',
    positions: pos.slice(),
    color: vec4.clone(color),
  })

  // negative axis
  pos[3 + axis] *= -1
  color[3] = 0.4
  axes.push({
    type: 'LINES',
    positions: pos.slice(),
    color: vec4.clone(color),
  })
}

function update(): void {
  requestAnimationFrame(update)

  renderer.clear()
  renderer.setWvTransform(camera.world2View())

  if (lastCodeUpdate !== undefined && time.current() - lastCodeUpdate > 2) {
    lastCodeUpdate = undefined
    recompile()
  }

  // Draw primary model
  switch (currentRenderMode) {
    case 'solid':
      renderer.renderV2((draw) => {
        draw('model', {}, mat4.create(), vec4.fromValues(0.5, 0.5, 1.0, 1))
      })
      break

    case 'wiresolid':
      renderer.renderV2(
        (draw) => {
          draw('model', {}, mat4.create(), vec4.fromValues(0.7, 0.7, 1.0, 1))
        },
        { wiresolid: true },
      )
      break

    case 'wiresolidLine':
      renderer.renderV2((draw) => {
        draw('model', {}, mat4.create(), vec4.fromValues(0, 0, 0, 1))
      })
      renderer.renderV2((draw) => {
        draw('model-line', {}, mat4.create(), vec4.fromValues(1, 1, 1.0, 1))
      })
      break

    default:
      throw `invalid render mode: ${currentRenderMode}`
  }

  // Draw axes
  renderer.renderWire((drawFunc) => {
    for (const obj of axes) {
      drawFunc(obj)
    }
  })
}

requestAnimationFrame(update)
autoReload.poll(1000)

function cubeModel(): ModelNode {
  // positions for front face
  const nodes = [
    vec3.fromValues(-1, 1, 1), // NW
    vec3.fromValues(0, 1, 1), // N
    vec3.fromValues(1, 1, 1), // NE

    vec3.fromValues(-1, 0, 1), // W
    vec3.fromValues(0, 0, 1), // CENTER
    vec3.fromValues(1, 0, 1), // E

    vec3.fromValues(-1, -1, 1), // SW
    vec3.fromValues(0, -1, 1), // S
    vec3.fromValues(1, -1, 1), // SE
  ]

  // normal for front face
  const normal = vec3.fromValues(0, 0, 1)

  const faceRotations = [
    quat.create(), // front face
    quat.fromEuler(quat.create(), 180, 0, 0), // back face
    quat.fromEuler(quat.create(), 90, 0, 0), // bottom face
    quat.fromEuler(quat.create(), -90, 0, 0), // top face
    quat.fromEuler(quat.create(), 0, 90, 0), // right face
    quat.fromEuler(quat.create(), 0, -90, 0), // left face
  ]

  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []

  for (let face = 0; face < faceRotations.length; face++) {
    const rot = faceRotations[face]
    const rotNodes = nodes.map((node) =>
      vec3.transformQuat(vec3.create(), node, rot),
    )
    const rotNormal = vec3.transformQuat(vec3.create(), normal, rot)

    for (const v of rotNodes) {
      positions.push(...v)
      normals.push(...rotNormal)
    }

    // Each face is a 2 x 2 set of quads
    const indexBase = face * 9
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        // Each quad has two tris
        indices.push(indexBase + (i * 3 + j))
        indices.push(indexBase + ((i + 1) * 3 + j))
        indices.push(indexBase + (i * 3 + j + 1))

        indices.push(indexBase + (i * 3 + j + 1))
        indices.push(indexBase + ((i + 1) * 3 + j))
        indices.push(indexBase + ((i + 1) * 3 + j + 1))
      }
    }
  }

  return {
    name: 'cube',
    mesh: {
      primitive: MeshPrimitive.Triangles,
      positions: {
        buffer: new Float32Array(positions),
        glType: 5126 as GLenum, // FLOAT
        componentCount: positions.length,
        componentsPerAttrib: 3,
      },
      normals: {
        buffer: new Float32Array(normals),
        glType: 5126 as GLenum, // FLOAT
        componentCount: normals.length,
        componentsPerAttrib: 3,
      },
      indices: {
        buffer: new Uint16Array(indices),
        glType: 5123 as GLenum, // USHORT
        componentCount: indices.length,
        componentsPerAttrib: 1,
      },
    },
    children: [],
  }
}
