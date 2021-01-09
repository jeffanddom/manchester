import { quat } from 'gl-matrix'
import { mat4, vec3, vec4 } from 'gl-matrix'

import { MouseButton, mouseButtonsFromBitmask } from '~/input/interfaces'
import * as models from '~/models'
import { Renderer3d } from '~/renderer/Renderer3d'
import * as math from '~/util/math'
import * as autoReload from '~/web/autoReload'

class Camera {
  private dist: number
  private angularOffset: [number, number]
  private viewTranslation: [number, number]

  constructor(canvas: HTMLCanvasElement) {
    this.dist = 3
    this.angularOffset = [0, 0]
    this.viewTranslation = [0, 0]

    // stop right clicks from opening the context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault()
      this.dist += event.deltaY * 0.05
      this.dist = math.clamp(this.dist, [1, 10])
    })

    canvas.addEventListener('pointermove', (event) => {
      const buttons = mouseButtonsFromBitmask(event.buttons)

      if (buttons.has(MouseButton.LEFT)) {
        const scale = 0.005
        this.angularOffset[0] = math.normalizeAngle(
          this.angularOffset[0] + event.movementX * -scale,
        )
        this.angularOffset[1] = math.normalizeAngle(
          this.angularOffset[1] + event.movementY * -scale,
        )
      }

      if (buttons.has(MouseButton.RIGHT)) {
        const scale = 0.0025
        this.viewTranslation[0] += event.movementX * scale
        this.viewTranslation[1] += event.movementY * scale
      }
    })
  }

  public world2View(): mat4 {
    const origin = vec3.create()
    const cameraPos = vec3.fromValues(0, 0, this.dist)
    vec3.rotateY(cameraPos, cameraPos, origin, this.angularOffset[0])
    vec3.rotateX(cameraPos, cameraPos, origin, this.angularOffset[1])

    const lookFrom = vec3.fromValues(0, 0, -1)
    const lookTo = vec3.negate(vec3.create(), cameraPos)
    vec3.normalize(lookTo, lookTo)
    const rot = quat.rotationTo(quat.create(), lookFrom, lookTo)

    vec3.add(
      cameraPos,
      cameraPos,
      vec3.fromValues(this.viewTranslation[0], this.viewTranslation[1], 0),
    )

    const m = mat4.create()
    mat4.fromRotationTranslation(m, rot, cameraPos)
    return mat4.invert(m, m)
  }
}

const canvas = document.getElementById('renderer') as HTMLCanvasElement
canvas.width = window.innerWidth
canvas.height = window.innerHeight

const renderer = new Renderer3d(canvas)
for (const [, doc] of models.gltfs) {
  renderer.loadGltf(doc)
}

const camera = new Camera(canvas)

function update(): void {
  requestAnimationFrame(update)

  renderer.setWvTransform(camera.world2View())

  renderer.renderV2((drawFunc) => {
    drawFunc('tank', {}, mat4.create(), vec4.fromValues(0.5, 0.5, 1.0, 1))
  })
}

requestAnimationFrame(update)
autoReload.poll()