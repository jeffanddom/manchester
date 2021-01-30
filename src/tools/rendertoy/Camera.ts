import { mat4, vec2, vec3 } from 'gl-matrix'

import { MouseButton, mouseButtonsFromBitmask } from '~/input/interfaces'
import * as math from '~/util/math'

export class Camera {
  private cameraSpherePos: math.SphereCoord
  private viewTranslation: vec2

  constructor(canvas: HTMLCanvasElement) {
    this.cameraSpherePos = math.sphereCoordFromValues(3, Math.PI / 2, 0)
    this.viewTranslation = vec2.create()

    // stop right clicks from opening the context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault()
      this.cameraSpherePos[0] += event.deltaY * 0.025
      this.cameraSpherePos[0] = math.clamp(this.cameraSpherePos[0], [1, 10])
    })

    canvas.addEventListener('pointermove', (event) => {
      const buttons = mouseButtonsFromBitmask(event.buttons)

      if (buttons.has(MouseButton.LEFT)) {
        const scale = 0.005
        this.cameraSpherePos[2] = math.normalizeAngle(
          this.cameraSpherePos[2] + event.movementX * -scale,
        )

        // Keep inclination away from poles.
        this.cameraSpherePos[1] += event.movementY * -scale
        this.cameraSpherePos[1] = math.clamp(this.cameraSpherePos[1], [
          0.0005,
          Math.PI - 0.0005,
        ])
      }

      if (buttons.has(MouseButton.RIGHT)) {
        const scale = 0.0025
        this.viewTranslation[0] += event.movementX * scale
        this.viewTranslation[1] += event.movementY * scale
      }
    })
  }

  public world2View(): mat4 {
    const cameraPos = math.sphereCoordToVec3(
      vec3.create(),
      this.cameraSpherePos,
    )

    const m = mat4.targetTo(
      mat4.create(),
      cameraPos,
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 1, 0),
    )

    return mat4.invert(m, m)
  }
}
