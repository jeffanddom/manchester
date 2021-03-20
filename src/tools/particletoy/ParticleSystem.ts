import { quat, vec3, vec4 } from 'gl-matrix'

import {
  ArrayDataType,
  BufferConfig,
  MeshBuffer,
  MeshPrimitive,
  NumericArray,
} from '~/renderer/interfaces'
import { Renderer3d } from '~/renderer/Renderer3d'
import { ShaderAttrib } from '~/renderer/shaders/common'

class ParticleAttribData<T extends NumericArray> {
  private data: T
  private dirty: boolean

  constructor(data: T) {
    this.data = data
    this.dirty = true
  }

  public copyFrom(src: T, offset?: number): void {
    this.data.set(src, offset)
    this.dirty = true
  }

  public copyInto(
    dst: T,
    srcOffset: number,
    length: number,
    dstOffset = 0,
  ): void {
    for (let i = 0; i < length; i++) {
      dst[dstOffset + dstOffset + i] = this.data[srcOffset + i]
    }
  }

  public getRawDataIfDirty(): T | undefined {
    return this.dirty ? this.data : undefined
  }

  public markClean(): void {
    this.dirty = false
  }
}

export class ParticleSystem {
  private meshName: string
  private capacity: number
  private numParticles: number

  // instance attrib data (flat arrays of glMatrix objects)
  private rotations: ParticleAttribData<Float32Array> // quat
  private translations: ParticleAttribData<Float32Array> // vec3
  private scales: ParticleAttribData<Float32Array> // vec3
  private colors: ParticleAttribData<Float32Array> // vec4

  // simulation settings (flat arrays)
  private rotVel: Float32Array // quat

  // preallocated temporaries
  private tempQuats: [quat, quat]

  public constructor(meshName: string, capacity: number) {
    this.meshName = meshName
    this.capacity = capacity
    this.numParticles = 0

    this.rotations = new ParticleAttribData(new Float32Array(4 * capacity))
    this.translations = new ParticleAttribData(new Float32Array(3 * capacity))
    this.scales = new ParticleAttribData(new Float32Array(3 * capacity))
    this.colors = new ParticleAttribData(new Float32Array(4 * capacity))

    this.rotVel = new Float32Array(4 * capacity)

    this.tempQuats = [quat.create(), quat.create()]
  }

  public add(config: {
    rotation: quat
    translation: vec3
    scale: vec3
    color: vec4
    rotVel: quat
  }): void {
    if (this.numParticles === this.capacity) {
      throw `particle system is full, can't add particle`
    }

    this.rotations.copyFrom(
      config.rotation as Float32Array,
      this.numParticles * 4,
    )
    this.translations.copyFrom(
      config.translation as Float32Array,
      this.numParticles * 3,
    )
    this.scales.copyFrom(config.scale as Float32Array, this.numParticles * 3)
    this.colors.copyFrom(config.color as Float32Array, this.numParticles * 4)
    this.rotVel.set(config.rotVel, this.numParticles * 4)

    this.numParticles++
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
  public update(): void {
    // Simulate rotations
    for (let i = 0; i < this.numParticles; i++) {
      const rotVel = this.tempQuats[0]
      const rotation = this.tempQuats[1]

      rotVel[0] = this.rotVel[i * 4 + 0]
      rotVel[1] = this.rotVel[i * 4 + 1]
      rotVel[2] = this.rotVel[i * 4 + 2]
      rotVel[3] = this.rotVel[i * 4 + 3]

      if (
        rotVel[0] === 0 &&
        rotVel[1] === 0 &&
        rotVel[2] === 0 &&
        rotVel[3] === 1
      ) {
        continue
      }

      const rotations = this.rotations
      rotations.copyInto(rotation as Float32Array, i * 4, 4)

      quat.multiply(rotation, rotation, rotVel)
      rotations.copyFrom(rotation as Float32Array, i * 4)
    }
  }

  public getNumParticles(): number {
    return this.numParticles
  }

  public getCapacity(): number {
    return this.capacity
  }

  public initRender(renderer: Renderer3d): void {
    const attribBuffers: Map<number, MeshBuffer> = new Map()
    attribBuffers.set(ShaderAttrib.Position, {
      // prettier-ignore
      bufferData: new Float32Array([
        0, 0.5, 0,
        -0.5, -0.5, 0,
        0.5, -0.5, 0,
      ]),
      componentsPerAttrib: 3,
    })

    const instanceAttribBufferConfig: Map<number, BufferConfig> = new Map()

    instanceAttribBufferConfig.set(ShaderAttrib.InstanceColor, {
      arrayType: ArrayDataType.Float,
      componentsPerAttrib: 4,
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

    renderer.renderParticles(this.meshName, this.numParticles, attribUpdates)
  }
}
