import { DerivedFloat32Array, quat, vec3 } from 'gl-matrix'

import { ParticleConfig, ParticleEmitter } from './interfaces'

import {
  ArrayDataType,
  BufferConfig,
  Float32ArrayWithSpan,
  MeshBuffer,
  MeshPrimitive,
} from '~/renderer/interfaces'
import { Renderer3d } from '~/renderer/Renderer3d'
import { ShaderAttrib } from '~/renderer/shaders/common'
import { QuatIdentity } from '~/util/math'
import { PriorityQueue } from '~/util/PriorityQueue'

class ParticleAttribData {
  private data: Float32Array
  private updatedStart: number
  private updatedEnd: number

  constructor(capacity: number) {
    this.data = new Float32Array(capacity)
    this.updatedStart = +Infinity
    this.updatedEnd = -Infinity
  }

  public set(n: number, v: number): void {
    this.data[n] = v

    if (n < this.updatedStart) {
      this.updatedStart = n
    }

    if (n > this.updatedEnd) {
      this.updatedEnd = n
    }
  }

  public setArray(src: ArrayLike<number>, dstOffset = 0): void {
    this.data.set(src, dstOffset)

    if (dstOffset < this.updatedStart) {
      this.updatedStart = dstOffset
    }

    const writeEnd = dstOffset + src.length - 1
    if (writeEnd > this.updatedEnd) {
      this.updatedEnd = writeEnd
    }
  }

  public get(n: number): number {
    return this.data[n]
  }

  public getArray(
    dst: DerivedFloat32Array,
    srcOffset: number,
    length?: number,
    dstOffset = 0,
  ): void {
    length = length ?? dst.length
    for (let i = 0; i < length; i++) {
      dst[dstOffset + dstOffset + i] = this.data[srcOffset + i]
    }
  }

  /**
   * Returns updated data, if any. Updated data is returned as an array, plus an
   * offset indicating where updated data begins, and a length indicating the
   * size of the updated data.
   */
  public getRawUpdates(): Float32ArrayWithSpan | undefined {
    if (this.updatedStart === Infinity) {
      return undefined
    }

    return [
      this.data,
      this.updatedStart,
      this.updatedEnd - this.updatedStart + 1,
    ]
  }

  public clearUpdates(): void {
    this.updatedStart = +Infinity
    this.updatedEnd = -Infinity
  }
}

export class ParticleSystem {
  private meshName: string
  private capacity: number
  private droppedParticles: number

  // emitters
  private emitters: ParticleEmitter[]

  // liveness tracking
  private freeList: PriorityQueue<number>
  private ttls: Float32Array // one float per particle
  private highWatermark: number // the last particle to send to the draw call

  // instance attrib data (flat arrays of glMatrix objects)
  private active: ParticleAttribData // one float per particle, 0 means not active, 1 means active
  private preRotations: ParticleAttribData // one quat per particle
  private postRotations: ParticleAttribData // one quat per particle
  private translations: ParticleAttribData // one vec3 per particle
  private scales: ParticleAttribData // one vec3 per particle
  private colors: ParticleAttribData // one vec4 per particle

  // physics
  private vels: Float32Array // one vec3 per particle
  private accels: Float32Array // one vec3 per particle
  private rotVels: Float32Array // one quat per particle

  // preallocated temporaries
  private tempQuats: [quat, quat]
  private tempVec3: [vec3, vec3, vec3]

  public constructor(meshName: string, capacity: number) {
    this.meshName = meshName
    this.capacity = capacity
    this.droppedParticles = 0

    this.emitters = []

    this.active = new ParticleAttribData(capacity)
    this.postRotations = new ParticleAttribData(4 * capacity)
    this.preRotations = new ParticleAttribData(4 * capacity)
    this.translations = new ParticleAttribData(3 * capacity)
    this.scales = new ParticleAttribData(3 * capacity)
    this.colors = new ParticleAttribData(4 * capacity)

    this.freeList = new PriorityQueue((a, b) => a - b)
    this.ttls = new Float32Array(capacity)
    this.highWatermark = 0

    for (let i = 0; i < capacity; i++) {
      this.freeList.push(i)
      this.active.set(i, 0)
    }

    this.vels = new Float32Array(3 * capacity)
    this.accels = new Float32Array(3 * capacity)
    this.rotVels = new Float32Array(4 * capacity)

    this.tempQuats = [quat.create(), quat.create()]
    this.tempVec3 = [vec3.create(), vec3.create(), vec3.create()]
  }

  private free(n: number): void {
    this.freeList.push(n)
    this.active.set(n, 0)

    // Reset high watermark if necessary
    if (n === this.highWatermark) {
      for (let i = this.highWatermark - 1; i >= 0; i--) {
        if (this.active.get(i) === 1) {
          this.highWatermark = i
          break
        }
      }
    }
  }

  public addEmitter(emitter: ParticleEmitter): void {
    this.emitters.push(emitter)
  }

  public add(config: ParticleConfig): void {
    const index = this.freeList.pop()
    if (index === undefined) {
      this.droppedParticles += 1
      return
    }

    if (index > this.highWatermark) {
      this.highWatermark = index
    }

    const index3 = index * 3
    const index4 = index * 4

    this.ttls[index] = config.ttl

    this.active.set(index, 1)
    this.preRotations.setArray(QuatIdentity, index4)
    this.postRotations.setArray(config.orientation, index4)
    this.translations.setArray(config.translation, index3)
    this.scales.setArray(config.scale, index3)
    this.colors.setArray(config.color, index4)

    this.vels.set(config.vel, index3)
    this.accels.set(config.accel, index3)
    this.rotVels.set(config.rotVel, index4)
  }

  /**
   * Run a single tick of simulation.
   *
   * Currently, we assume that the frame rate is fixed. We could consider
   * adding frame-rate independence, but this would involve interpolating
   * rotations, which could be expensive. One option would be to convert the
   * rotation attribute from quat to axis-angle. Interpolating angles is cheap,
   * and the vertex shader could perform the conversion from axis-angle to
   * rotation matrix.
   */
  public update(dt: number): void {
    // Simulate emitters
    const addParticle = (config: ParticleConfig): void => {
      this.add(config)
    }
    for (const emitter of this.emitters) {
      emitter.update(dt, addParticle)
    }

    this.emitters = this.emitters.filter((e) => e.isActive())

    // Simulate particles
    for (let i = 0; i < this.capacity; i++) {
      if (this.active.get(i) === 0) {
        continue
      }

      // Assuming update() is called after add() within the same frame, the
      // time delta will be applied to new particles. In other words, this
      // treats particles as having been spawned at the beginning of the
      // interval, rather than the end.
      this.ttls[i] -= dt
      if (this.ttls[i] <= 0) {
        this.free(i)
        continue
      }

      const index3 = i * 3
      const index4 = i * 4

      // Alias our temporary glMatrix objects
      const rotVel = this.tempQuats[0]
      const preRotation = this.tempQuats[1]

      const vel = this.tempVec3[0]
      const accel = this.tempVec3[1]
      const trans = this.tempVec3[2]

      // Rotate particle
      rotVel[0] = this.rotVels[index4 + 0]
      rotVel[1] = this.rotVels[index4 + 1]
      rotVel[2] = this.rotVels[index4 + 2]
      rotVel[3] = this.rotVels[index4 + 3]
      if (!quat.equals(rotVel, QuatIdentity)) {
        this.preRotations.getArray(preRotation, index4)
        quat.multiply(preRotation, rotVel, preRotation)
        this.preRotations.setArray(preRotation, index4)
      }

      // Apply ballistic motion. For simplicity, we apply the full acceleration
      // increment over the course of the entire time delta, rather than use a
      // more accurate integration technique. As long as it looks fine, we'll go
      // with the simpler math.
      vel[0] = this.vels[index3 + 0]
      vel[1] = this.vels[index3 + 1]
      vel[2] = this.vels[index3 + 2]

      accel[0] = this.accels[index3 + 0] * dt
      accel[1] = this.accels[index3 + 1] * dt
      accel[2] = this.accels[index3 + 2] * dt

      vec3.add(vel, vel, accel)
      this.vels[index3 + 0] = vel[0]
      this.vels[index3 + 1] = vel[1]
      this.vels[index3 + 2] = vel[2]

      vec3.scale(vel, vel, dt)
      this.translations.getArray(trans, index3)
      vec3.add(trans, trans, vel)
      this.translations.setArray(trans, index3)
    }

    if (this.droppedParticles > 0) {
      console.warn(`particle system (capacity ${this.capacity}) dropped particles: ${this.droppedParticles}`)
      this.droppedParticles = 0
    }
  }

  public getCapacity(): number {
    return this.capacity
  }

  public numActiveEmitters(): number {
    return this.emitters.length
  }

  public initRender(renderer: Renderer3d): void {
    const attribBuffers: Map<number, MeshBuffer> = new Map()
    attribBuffers.set(ShaderAttrib.Position, {
      // prettier-ignore
      bufferData: new Float32Array([
        0, 1 / Math.sqrt(3), 0,
        -0.5, -0.5 / Math.sqrt(3), 0,
        0.5, -0.5 / Math.sqrt(3), 0,        
      ]),
      componentsPerAttrib: 3,
    })

    const instanceAttribBufferConfig: Map<number, BufferConfig> = new Map()

    instanceAttribBufferConfig.set(ShaderAttrib.InstanceActive, {
      arrayType: ArrayDataType.Float,
      componentsPerAttrib: 1,
    })

    instanceAttribBufferConfig.set(ShaderAttrib.InstancePreRotation, {
      arrayType: ArrayDataType.Float,
      componentsPerAttrib: 4,
    })

    instanceAttribBufferConfig.set(ShaderAttrib.InstancePostRotation, {
      arrayType: ArrayDataType.Float,
      componentsPerAttrib: 4,
    })

    instanceAttribBufferConfig.set(ShaderAttrib.InstanceTranslation, {
      arrayType: ArrayDataType.Float,
      componentsPerAttrib: 3,
    })

    instanceAttribBufferConfig.set(ShaderAttrib.InstanceScale, {
      arrayType: ArrayDataType.Float,
      componentsPerAttrib: 3,
    })

    instanceAttribBufferConfig.set(ShaderAttrib.InstanceColor, {
      arrayType: ArrayDataType.Float,
      componentsPerAttrib: 4,
    })

    renderer.loadParticleMesh(
      this.meshName,
      {
        primitive: MeshPrimitive.Triangles,
        vertsPerInstance: 3,
        attribBuffers,
        instanceAttribBufferConfig,
      },
      this.capacity,
    )
  }

  public render(renderer: Renderer3d): void {
    const attribUpdates = new Map()

    const activeData = this.active.getRawUpdates()
    if (activeData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceActive, activeData)
      this.active.clearUpdates()
    }

    const preRotationData = this.preRotations.getRawUpdates()
    if (preRotationData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstancePreRotation, preRotationData)
      this.preRotations.clearUpdates()
    }

    const postRotationData = this.postRotations.getRawUpdates()
    if (postRotationData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstancePostRotation, postRotationData)
      this.postRotations.clearUpdates()
    }

    const transData = this.translations.getRawUpdates()
    if (transData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceTranslation, transData)
      this.translations.clearUpdates()
    }

    const scaleData = this.scales.getRawUpdates()
    if (scaleData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceScale, scaleData)
      this.scales.clearUpdates()
    }

    const colorData = this.colors.getRawUpdates()
    if (colorData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceColor, colorData)
      this.colors.clearUpdates()
    }

    renderer.renderParticles(this.meshName, this.highWatermark, attribUpdates)
  }
}
