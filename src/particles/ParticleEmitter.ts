import { vec2 } from 'gl-matrix'
import { sample } from 'lodash'

import { radialTranslate2, lerp } from '~/mathutil'
import { Renderable, Primitive } from '~renderer/interfaces'

interface Particle {
  position: vec2
  color: string
  radius: number
  orientation: number
  speed: number
  ttl: number
}

export class ParticleEmitter {
  startTime: number
  dead: boolean
  particles: Particle[] = []
  potentialParticles: number

  spawnTtl: number
  position: vec2
  particleRate: number
  particleRadius: number
  particleTtl: number
  particleSpeedRange: [number, number]
  orientation: number
  arc: number
  colors: string[]

  constructor(params: {
    spawnTtl: number
    position: vec2
    particleRate: number // particles per second
    particleRadius: number
    particleTtl: number
    particleSpeedRange: [number, number]
    arc: number
    orientation: number
    colors: string[]
  }) {
    this.potentialParticles = 0
    this.dead = false

    this.spawnTtl = params.spawnTtl
    this.position = vec2.clone(params.position)
    this.particleRadius = params.particleRadius
    this.particleRate = params.particleRate
    this.particleTtl = params.particleTtl
    this.particleSpeedRange = params.particleSpeedRange
    this.arc = params.arc
    this.orientation = params.orientation
    this.colors = params.colors
  }

  update(dt: number) {
    this.spawnTtl -= dt

    if (this.spawnTtl <= 0 && this.particles.length === 0) {
      this.dead = true
      return
    }

    // Age particles
    this.particles.forEach((p) => (p.ttl -= dt))

    // Kill old particles
    this.particles = this.particles.filter((p) => p.ttl > 0)

    // Move particles
    this.particles.forEach((p) => {
      radialTranslate2(p.position, p.position, p.orientation, p.speed * dt)
    })

    // Spawn new particles
    if (this.spawnTtl > 0) {
      this.potentialParticles += this.particleRate * dt
      while (this.potentialParticles >= 1) {
        this.particles.push({
          position: vec2.clone(this.position),
          color: sample(this.colors),
          radius: lerp(0, this.particleRadius, Math.random()), // TODO: add min radius
          orientation: lerp(
            this.orientation - this.arc / 2,
            this.orientation + this.arc / 2,
            Math.random(),
          ),
          speed: lerp(
            this.particleSpeedRange[0],
            this.particleSpeedRange[1],
            Math.random(),
          ),
          ttl: this.particleTtl,
        })
        this.potentialParticles -= 1
      }
    }
  }

  getRenderables(): Renderable[] {
    return this.particles.map((p) => {
      return {
        primitive: Primitive.CIRCLE,
        fillStyle: p.color,
        pos: p.position,
        radius: p.radius,
      }
    })
  }
}
