import { quat, vec3, vec4 } from 'gl-matrix'

import { Immutable } from '~/types/immutable'

export interface ParticleConfig {
  ttl: number
  orientation: Immutable<quat>
  translation: Immutable<vec3>
  scale: Immutable<vec3>
  color: Immutable<vec4>
  vel: Immutable<vec3>
  accel: Immutable<vec3>
  rotVel: Immutable<quat>
}

export interface ParticleEmitter {
  update(dt: number, addParticle: (config: ParticleConfig) => void): void
  isActive(): boolean
}
