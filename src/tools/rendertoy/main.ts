import { mat4, vec3, vec4 } from 'gl-matrix'

import * as models from '~/models'
import { Renderer3d } from '~/renderer/Renderer3d'
import * as autoReload from '~/web/autoReload'

const canvas = document.getElementById('renderer') as HTMLCanvasElement
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const renderer = new Renderer3d(canvas)

for (const [, doc] of models.gltfs) {
  renderer.loadGltf(doc)
}

function update(): void {
  requestAnimationFrame(update)
  renderer.renderV2((drawFunc) => {
    drawFunc(
      'tank',
      {},
      mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, -5)),
      vec4.fromValues(0.5, 0.5, 1.0, 1),
    )
  })
}

requestAnimationFrame(update)
autoReload.poll()
