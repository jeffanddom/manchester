import CodeMirror from 'codemirror'
import { mat4, vec2, vec4 } from 'gl-matrix'

import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/clike/clike.js'

import * as models from '~/assets/models'
import { makeCubeModel, triModelAddEdgeOn } from '~/renderer/geometryUtils'
import * as gltf from '~/renderer/gltf'
import {
  Renderer3d,
  ShaderCompileError,
  ShaderLinkError,
  WireObject,
} from '~/renderer/Renderer3d'
import { shader as solidShader } from '~/renderer/shaders/solid'
import { shader as wiresolidShader } from '~/renderer/shaders/wiresolid'
import { Camera } from '~/tools/rendertoy/Camera'
import * as time from '~/util/time'
import * as autoReload from '~/web/autoReload'

type RenderMode = 'solid' | 'wiresolid'
let renderMode: RenderMode = 'solid'

if (
  (document.querySelector('#controls input:checked') as HTMLInputElement)
    .value === 'wiresolid'
) {
  renderMode = 'wiresolid'
}

const shaders = {
  solid: solidShader,
  wiresolid: wiresolidShader,
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
  value: shaders[renderMode].vertexSrc,
})

const fsEditor = CodeMirror(document.getElementById('editor-fs')!, {
  ...codeMirrorOptions,
  value: shaders[renderMode].fragmentSrc,
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
  renderMode = value as RenderMode

  vsEditor.setValue(shaders[renderMode].vertexSrc)
  fsEditor.setValue(shaders[renderMode].fragmentSrc)
})

const renderer = new Renderer3d(canvas)

renderer.loadModel('model', triModelAddEdgeOn(makeCubeModel()))

window.addEventListener('resize', () => {
  canvas.width = canvas.parentElement!.clientWidth
  canvas.height = canvas.parentElement!.clientHeight
  renderer.setViewportDimensions(vec2.fromValues(canvas.width, canvas.height))
})

const camera = new Camera(canvas)

function recompile(): void {
  try {
    renderer.loadShader(
      renderMode,
      {
        ...shaders[renderMode],
        vertexSrc: vsEditor.getValue(),
        fragmentSrc: fsEditor.getValue(),
      },
      { allowOverride: true },
    )
  } catch (err) {
    if (err instanceof ShaderCompileError) {
      if (err.vertexShaderLog !== undefined) {
        console.log('vertex shader error:\n', err.vertexShaderLog)
      }
      if (err.fragmentShaderLog !== undefined) {
        console.log('fragment shader error:\n', err.fragmentShaderLog)
      }
    } else if (err instanceof ShaderLinkError) {
      console.log('link error:\n', err.toString())
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
  switch (renderMode) {
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

    default:
      throw `invalid render mode: ${renderMode}`
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
