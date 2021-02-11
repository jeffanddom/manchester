export class StackAllocator<T> {
  private objects: T[]
  private nextObject: number
  private frameSizes: number[]
  private setDefault: (obj: T) => void
  private setFree?: (obj: T) => void

  constructor(config: {
    size: number
    create: () => T
    setDefault: (obj: T) => void // called to initialize object in allocDefault
    setFree?: (obj: T) => void // set to clear freed objects to a sentinel value, to detect use-after-free bugs
  }) {
    this.objects = []
    for (let i = 0; i < config.size; i++) {
      this.objects.push(config.create())
    }

    this.nextObject = 0
    this.frameSizes = []
    this.setDefault = config.setDefault
    this.setFree = config.setFree
  }

  pushFrame(): void {
    this.frameSizes.push(0)
  }

  popFrame(): void {
    if (this.frameSizes.length === 0) {
      throw `no frame to pop`
    }

    const frameSize = this.frameSizes.pop()! // can't be undefined if length > 0
    this.nextObject -= frameSize

    if (this.setFree !== undefined) {
      for (let i = this.nextObject; i < this.nextObject + frameSize; i++) {
        this.setFree(this.objects[i])
      }
    }
  }

  allocDirty(): T {
    if (this.frameSizes.length === 0) {
      throw `no frame pushed`
    }

    if (this.nextObject >= this.objects.length) {
      throw `exceeded allocator capacity`
    }

    const obj = this.objects[this.nextObject]
    this.nextObject += 1
    this.frameSizes[this.frameSizes.length - 1] += 1

    return obj
  }

  allocDefault(): T {
    const obj = this.allocDirty()
    this.setDefault(obj)
    return obj
  }
}
