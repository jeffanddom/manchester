import { mat4, quat, vec3, vec4 } from 'gl-matrix'

import { MouseButton, mouseButtonsFromBitmask } from '~/input/interfaces'
import * as math from '~/util/math'

export class Camera {
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

        console.log(
          `x: ${event.movementX} (${this.angularOffset[0]}), y: ${event.movementY} (${this.angularOffset[1]})`,
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
    // Using this.angularOffset in this manner seems to guarantee gimbal lock.
    // If we use vec3.rotateY followed by vec3.rotateX, we hit gimbal lock if we
    // rotate 90 degrees on any single axis. To compensate, the code below uses
    // a variable second axis to rotate around--instead of rotating around X, it
    // rotates around whatever the X axis becomes if you apply the first
    // rotation arond Y.
    //
    // This isn't a great fix, because we hit gimbal lock if we rotate any
    // single axis to 180 degrees. Fixing this will likely require a different
    // handling of mouse input. The updates to our spherical coordinates needs
    // to be aware of the relative orientation of the camera.

    const origin = vec3.create()
    const cameraPos = vec3.fromValues(0, 0, this.dist)
    vec3.rotateY(cameraPos, cameraPos, origin, this.angularOffset[0])

    // Next, we pick an axis to rotate around for the second offset component.
    // If the first component were zero, this would just be the positive X axis.
    // However, we want whatever the positive X axis would be rotated to if we
    // applied the Y-rotation above.
    const rotAxis = vec3.fromValues(1, 0, 0)
    vec3.rotateY(rotAxis, rotAxis, origin, this.angularOffset[0])
    const rotMat = mat4.fromRotation(
      mat4.create(),
      this.angularOffset[1],
      rotAxis,
    )

    // Now we rotate the camera position
    const cameraPos4 = vec4.fromValues(
      cameraPos[0],
      cameraPos[1],
      cameraPos[2],
      1,
    )
    vec4.transformMat4(cameraPos4, cameraPos4, rotMat)
    cameraPos[0] = cameraPos4[0]
    cameraPos[1] = cameraPos4[1]
    cameraPos[2] = cameraPos4[2]

    // Now determine the orientation of the camera, which should point at the
    // origin.
    const lookFrom = vec3.fromValues(0, 0, -1)
    const lookTo = vec3.negate(vec3.create(), cameraPos)
    vec3.normalize(lookTo, lookTo)
    const rot = quat.rotationTo(quat.create(), lookFrom, lookTo)

    const translate = vec3.fromValues(
      this.viewTranslation[0],
      this.viewTranslation[1],
      0,
    )
    vec3.transformQuat(translate, translate, rot)

    vec3.add(cameraPos, cameraPos, translate)

    const m = mat4.create()
    mat4.fromRotationTranslation(m, rot, cameraPos)
    return mat4.invert(m, m)
  }
}
