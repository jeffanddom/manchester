import { vec2 } from 'gl-matrix'
import { sample } from 'lodash'

export class Camera {
  position: vec2
  viewportSize: [number, number]
  minWorldPos: vec2
  worldDimensions: [number, number]

  // shake stuff
  shakeStartTime: number
  shakeLastMoveTime: number
  shakeOffset: vec2

  constructor(
    viewportSize: [number, number],
    minWorldPos: vec2,
    worldDimensions: [number, number],
  ) {
    this.position = vec2.create()
    this.viewportSize = viewportSize
    this.minWorldPos = minWorldPos
    this.worldDimensions = worldDimensions

    this.shakeStartTime = 0
    this.shakeLastMoveTime = 0
    this.shakeOffset = vec2.fromValues(0, 0)
  }

  shake(): void {
    this.shakeStartTime = Date.now()
    this.shakeLastMoveTime = 0
  }

  update(): void {
    if (this.shakeStartTime === 0) {
      return
    }

    const now = Date.now()

    if (this.shakeStartTime < now - 250) {
      vec2.zero(this.shakeOffset)
      this.shakeStartTime = 0
      return
    }

    if (this.shakeLastMoveTime < now - 1000 / 60) {
      this.shakeOffset = sample([
        vec2.fromValues(-3, 0),
        vec2.fromValues(3, 0),
        vec2.fromValues(0, -3),
        vec2.fromValues(0, 3),
      ])
      this.shakeLastMoveTime = now
    }
  }

  maxWorldPos(): vec2 {
    return vec2.fromValues(
      this.minWorldPos[0] + this.worldDimensions[0],
      this.minWorldPos[1] + this.worldDimensions[1],
    )
  }

  centerAt(worldPos: vec2): void {
    vec2.sub(
      this.position,
      worldPos,
      vec2.fromValues(this.viewportSize[0] / 2, this.viewportSize[1] / 2),
    )

    vec2.max(this.position, this.position, this.minWorldPos)

    vec2.min(
      this.position,
      this.position,
      vec2.sub(
        vec2.create(),
        this.maxWorldPos(),
        vec2.fromValues(this.viewportSize[0], this.viewportSize[1]),
      ),
    )
  }

  toRenderPos(worldPos: vec2): vec2 {
    const renderPos = vec2.add(
      vec2.create(),
      vec2.sub(vec2.create(), worldPos, this.position),
      this.shakeOffset,
    )
    return vec2.fromValues(Math.floor(renderPos[0]), Math.floor(renderPos[1]))
  }
}
