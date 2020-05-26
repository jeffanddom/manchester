import { vec2 } from 'gl-matrix'
import { sample } from 'lodash'

export class Camera {
  position: vec2
  viewportSize: vec2
  minWorldPos: vec2
  worldDimensions: vec2

  // shake stuff
  ttl: number
  cooldownTtl: number
  shakeOffset: vec2

  constructor(viewportSize: vec2, minWorldPos: vec2, worldDimensions: vec2) {
    this.position = vec2.create()
    this.viewportSize = viewportSize
    this.minWorldPos = minWorldPos
    this.worldDimensions = worldDimensions

    this.ttl = 0
    this.cooldownTtl = 0
    this.shakeOffset = vec2.fromValues(0, 0)
  }

  shake(): void {
    this.ttl = 0.25
    this.cooldownTtl = 0
  }

  update(dt: number): void {
    this.ttl -= dt
    if (this.ttl <= 0) {
      this.ttl = 0
      vec2.zero(this.shakeOffset)
      return
    }

    this.cooldownTtl -= dt
    if (this.cooldownTtl <= 0) {
      this.cooldownTtl += 1 / 60
      this.shakeOffset = sample([
        vec2.fromValues(-3, 0),
        vec2.fromValues(3, 0),
        vec2.fromValues(0, -3),
        vec2.fromValues(0, 3),
      ])
    }
  }

  maxWorldPos(): vec2 {
    return vec2.add(vec2.create(), this.minWorldPos, this.worldDimensions)
  }

  centerAt(worldPos: vec2): void {
    vec2.sub(
      this.position,
      worldPos,
      vec2.scale(vec2.create(), this.viewportSize, 0.5),
    )

    vec2.max(this.position, this.position, this.minWorldPos)

    vec2.min(
      this.position,
      this.position,
      vec2.sub(vec2.create(), this.maxWorldPos(), this.viewportSize),
    )
  }

  toRenderPos(worldPos: vec2): vec2 {
    const renderPos = vec2.add(
      vec2.create(),
      vec2.sub(vec2.create(), worldPos, this.position),
      this.shakeOffset,
    )
    return vec2.floor(renderPos, renderPos)
  }
}
