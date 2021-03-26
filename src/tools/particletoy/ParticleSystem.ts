import { quat, vec3, vec4 } from 'gl-matrix'

import {
  ArrayDataType,
  BufferConfig,
  MeshBuffer,
  MeshPrimitive,
} from '~/renderer/interfaces'
import { Renderer3d } from '~/renderer/Renderer3d'
import { ShaderAttrib } from '~/renderer/shaders/common'
import { PriorityQueue } from '~/util/PriorityQueue'

class ParticleAttribData {
  private data: Float32Array
  private dirty: boolean

  constructor(capacity: number) {
    this.data = new Float32Array(capacity)
    this.dirty = true
  }

  public setArray(src: ArrayLike<number>, offset?: number): void {
    this.data.set(src, offset)
    this.dirty = true
  }

  public set(n: number, v: number): void {
    this.data[n] = v
    this.dirty = true
  }

  public get(n: number): number {
    return this.data[n]
  }

  public getArray(
    dst: Float32Array,
    srcOffset: number,
    length: number,
    dstOffset = 0,
  ): void {
    for (let i = 0; i < length; i++) {
      dst[dstOffset + dstOffset + i] = this.data[srcOffset + i]
    }
  }

  public getRawDataIfDirty(): Float32Array | undefined {
    return this.dirty ? this.data : undefined
  }

  public markClean(): void {
    this.dirty = false
  }
}

export class ParticleSystem {
  private meshName: string
  private capacity: number

  // liveness tracking
  private freeList: PriorityQueue<number>
  private ttls: Float32Array // one float per particle
  private highWatermark: number // the last particle to send to the draw call

  // instance attrib data (flat arrays of glMatrix objects)
  private active: ParticleAttribData // one float per particle, 0 means not active, 1 means active
  private rotations: ParticleAttribData // one quat per particle
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

    this.active = new ParticleAttribData(capacity)
    this.rotations = new ParticleAttribData(4 * capacity)
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

  public add(config: {
    ttl: number
    rotation: quat
    translation: vec3
    scale: vec3
    color: vec4
    vel: vec3
    accel: vec3
    rotVel: quat
  }): void {
    const index = this.freeList.pop()
    if (index === undefined) {
      throw `particle system is full, can't add particle`
    }

    if (index > this.highWatermark) {
      this.highWatermark = index
    }

    const index3 = index * 3
    const index4 = index * 4

    this.ttls[index] = config.ttl

    this.active.set(index, 1)
    this.rotations.setArray(config.rotation, index4)
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
    // Simulate rotations
    for (let i = 0; i < this.capacity; i++) {
      if (this.active.get(i) === 0) {
        continue
      }

      this.ttls[i] -= dt
      if (this.ttls[i] <= 0) {
        this.free(i)
        continue
      }

      const index3 = i * 3
      const index4 = i * 4

      // Alias our temporary glMatrix objects
      const rotVel = this.tempQuats[0]
      const rotation = this.tempQuats[1]
      const vel = this.tempVec3[0]
      const accel = this.tempVec3[1]
      const trans = this.tempVec3[2]

      // Rotate particle
      rotVel[0] = this.rotVels[index4 + 0]
      rotVel[1] = this.rotVels[index4 + 1]
      rotVel[2] = this.rotVels[index4 + 2]
      rotVel[3] = this.rotVels[index4 + 3]

      if (
        !(
          rotVel[0] === 0 &&
          rotVel[1] === 0 &&
          rotVel[2] === 0 &&
          rotVel[3] === 1
        )
      ) {
        const rotations = this.rotations
        rotations.getArray(rotation as Float32Array, index4, 4)

        quat.multiply(rotation, rotation, rotVel)
        rotations.setArray(rotation, index4)
      }

      // Apply ballistic motion
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
      this.translations.getArray(trans as Float32Array, index3, 3)
      vec3.add(trans, trans, vel)
      this.translations.setArray(trans, index3)
    }
  }

  public getCapacity(): number {
    return this.capacity
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

    instanceAttribBufferConfig.set(ShaderAttrib.InstanceRotation, {
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

    const activeData = this.active.getRawDataIfDirty()
    if (activeData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceActive, activeData)
      this.active.markClean()
    }

    const rotData = this.rotations.getRawDataIfDirty()
    if (rotData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceRotation, rotData)
      this.rotations.markClean()
    }

    const transData = this.translations.getRawDataIfDirty()
    if (transData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceTranslation, transData)
      this.translations.markClean()
    }

    const scaleData = this.scales.getRawDataIfDirty()
    if (scaleData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceScale, scaleData)
      this.scales.markClean()
    }

    const colorData = this.colors.getRawDataIfDirty()
    if (colorData !== undefined) {
      attribUpdates.set(ShaderAttrib.InstanceColor, colorData)
      this.colors.markClean()
    }

    renderer.renderParticles(this.meshName, this.highWatermark, attribUpdates)
  }
}
