import CodeMirror from 'codemirror'
import { mat4, vec2, vec4 } from 'gl-matrix'

import * as models from './models'

import {
  FragmentShaderError,
  Renderer3d,
  ShaderLinkError,
  UnlitObject,
  UnlitObjectType,
  VertexShaderError,
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

switch ((document.getElementById('modeSelect') as HTMLSelectElement).value) {
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

document.getElementById('modeSelect')!.addEventListener('change', (e) => {
  const value = (e.target! as HTMLSelectElement).value
  setCurrentRenderMode(value as RenderMode)

  vsEditor.setValue(shaders[currentShader].vertexSrc)
  fsEditor.setValue(shaders[currentShader].fragmentSrc)
})

let currentModel: string = (document.getElementById(
  'modelSelect',
) as HTMLSelectElement).value

document.getElementById('modelSelect')!.addEventListener('change', (e) => {
  currentModel = (e.target! as HTMLSelectElement).value
})

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
canvas.width = canvas.parentElement!.clientWidth * 2
canvas.height = canvas.parentElement!.clientHeight * 2

const renderer = new Renderer3d(canvas)
models.load(renderer)

window.addEventListener('resize', () => {
  canvas.width = canvas.parentElement!.clientWidth * 2
  canvas.height = canvas.parentElement!.clientHeight * 2
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
      renderer.renderSolid([
        {
          modelName: currentModel,
          modelModifiers: {},
          model2World: mat4.create(),
          color: vec4.fromValues(0.5, 0.5, 1, 1),
        },
      ])
      break

    case 'wiresolid':
      renderer.renderWiresolid([
        {
          modelName: currentModel,
          modelModifiers: {},
          model2World: mat4.create(),
          color: vec4.fromValues(0.7, 0.7, 1, 1),
        },
      ])
      break

    case 'wiresolidLine':
      renderer.renderWiresolidLine([
        {
          modelName: currentModel,
          modelModifiers: {},
          model2World: mat4.create(),
          color: vec4.fromValues(1, 1, 1, 1),
        },
      ])
      break

    default:
      throw `invalid render mode: ${currentRenderMode}`
  }

  renderer.renderUnlit(axes)
}

requestAnimationFrame(update)
autoReload.poll(1000)
