import { vec2 } from 'gl-matrix'
import { sample } from 'lodash'
import * as mathutil from '~/mathutil'

export class Camera {
  position: vec2
  viewportDimensions: vec2
  minWorldPos: vec2
  worldDimensions: vec2
  zoom: number // ratio of view distance to world distance

  // shake stuff
  ttl: number
  cooldownTtl: number
  shakeOffset: vec2

  constructor(viewportSize: vec2, minWorldPos: vec2, worldDimensions: vec2) {
    this.position = vec2.create()
    this.viewportDimensions = viewportSize
    this.minWorldPos = minWorldPos
    this.worldDimensions = worldDimensions
    this.zoom = 1

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

  setPosition(worldPos: vec2): void {
    mathutil.clamp2(this.position, worldPos, [
      vec2.add(
        vec2.create(),
        this.minWorldPos,
        vec2.scale(vec2.create(), this.viewportDimensions, 0.5 / this.zoom),
      ),
      vec2.sub(
        vec2.create(),
        this.maxWorldPos(),
        vec2.scale(vec2.create(), this.viewportDimensions, 0.5 / this.zoom),
      ),
    ])
  }

  /**
   * Convert the given worldspace position to a viewport position (pixel offset
   * from NW corner of viewport).
   */
  w2v(wpos: vec2): vec2 {
    const viewOriginWPos = vec2.sub(
      vec2.create(),
      this.position,
      vec2.scale(vec2.create(), this.viewportDimensions, 0.5 / this.zoom),
    )
    const p = vec2.sub(vec2.create(), wpos, viewOriginWPos)
    vec2.scale(p, p, this.zoom)
    vec2.add(p, p, this.shakeOffset)
    return vec2.floor(p, p)
  }

  /**
   * Convert the given viewport position (pixel offset from NW corner of
   * viewport) to a worldspace position.
   */
  v2w(vpos: vec2): vec2 {
    const viewOriginWPos = vec2.sub(
      vec2.create(),
      this.position,
      vec2.scale(vec2.create(), this.viewportDimensions, 0.5 / this.zoom),
    )
    return vec2.add(
      vec2.create(),
      vec2.scale(vec2.create(), vpos, 1 / this.zoom),
      viewOriginWPos,
    )
  }
}
