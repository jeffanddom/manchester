import { quat, vec3, vec4 } from 'gl-matrix'

export interface ParticleConfig {
  ttl: number
  orientation: quat
  translation: vec3
  scale: vec3
  color: vec4
  vel: vec3
  accel: vec3
  rotVel: quat
}

export interface ParticleEmitter {
  update(dt: number, addParticle: (config: ParticleConfig) => void): void
  isActive(): boolean
}
