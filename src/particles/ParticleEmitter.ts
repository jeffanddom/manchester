import { vec2 } from 'gl-matrix'
import { sample } from 'lodash'

import { radialTranslate2, lerp } from '~/mathutil'

interface Particle {
  position: vec2
  color: string
  radius: number
  orientation: number
  spawnTime: number
}

export class ParticleEmitter {
  startTime: number
  dead: boolean
  particles: Particle[] = []
  potentialParticles: number

  position: vec2
  particleRate: number
  particleRadius: number
  particleLifespan: number
  particleSpeedRange: [number, number]
  emitterLifespan: number
  orientation: number
  arc: number
  colors: string[]

  constructor(params: {
    position: vec2
    particleRate: number
    particleRadius: number
    particleLifespan: number
    particleSpeedRange: [number, number]
    emitterLifespan: number
    arc: number
    orientation: number
    colors: string[]
  }) {
    this.potentialParticles = 0
    this.dead = false
    this.startTime = Date.now()

    this.position = vec2.copy(vec2.create(), params.position)
    this.particleRadius = params.particleRadius
    this.particleRate = params.particleRate
    this.particleLifespan = params.particleLifespan
    this.particleSpeedRange = params.particleSpeedRange
    this.emitterLifespan = params.emitterLifespan
    this.arc = params.arc
    this.orientation = params.orientation
    this.colors = params.colors
  }

  update() {
    const timestamp = Date.now()

    // Kill old particles
    this.particles = this.particles.filter((p) => {
      return p.spawnTime + this.particleLifespan > timestamp
    })

    // Move existing particles
    this.particles.forEach((p) => {
      radialTranslate2(
        p.position,
        p.position,
        p.orientation,
        lerp(
          this.particleSpeedRange[0],
          this.particleSpeedRange[1],
          Math.random(),
        ),
      )
    })

    if (this.startTime + this.emitterLifespan < timestamp) {
      if (this.particles.length === 0) {
        this.dead = true
      }
    } else {
      // Spawn new particles
      this.potentialParticles += this.particleRate
      while (this.potentialParticles >= 1) {
        this.particles.push({
          position: vec2.copy(vec2.create(), this.position),
          color: sample(this.colors),
          radius: lerp(0, this.particleRadius, Math.random()), // TODO: add min radius
          orientation: lerp(
            this.orientation - this.arc / 2,
            this.orientation + this.arc / 2,
            Math.random(),
          ),
          spawnTime: timestamp,
        })
        this.potentialParticles -= 1
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach((p) => {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.position[0], p.position[1], p.radius, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}
