import { mat4, vec2, vec3 } from 'gl-matrix'

import { MouseButton, mouseButtonsFromBitmask } from '~/input/interfaces'
import * as math from '~/util/math'

export class Camera {
  private spherePos: math.SphereCoord

  constructor(canvas: HTMLCanvasElement) {
    this.spherePos = math.sphereCoordFromValues(3, Math.PI / 2, 0)

    // stop right clicks from opening the context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    canvas.addEventListener('wheel', (event) => {
      event.preventDefault()
      this.spherePos[0] += event.deltaY * 0.025
      this.spherePos[0] = math.clamp(this.spherePos[0], 1, 10)
    })

    canvas.addEventListener('pointermove', (event) => {
      const buttons = mouseButtonsFromBitmask(event.buttons)

      if (buttons.has(MouseButton.LEFT)) {
        const scale = 0.005
        this.spherePos[2] = math.normalizeAngle(
          this.spherePos[2] + event.movementX * -scale,
        )

        // Keep inclination away from poles.
        this.spherePos[1] += event.movementY * -scale
        this.spherePos[1] = math.clamp(
          this.spherePos[1],
          0.0005,
          Math.PI - 0.0005,
        )
      }
    })
  }

  public world2View(): mat4 {
    const worldPos = math.sphereCoordToVec3(vec3.create(), this.spherePos)
    const m = mat4.targetTo(
      mat4.create(),
      worldPos,
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 1, 0),
    )
    return mat4.invert(m, m)
  }
}
