export class StackAllocator<T> {
  private objects: T[]
  private nextObject: number
  private frameSizes: number[]
  private setDefault: (obj: T) => void

  /**
   * setDefault should update the provided object in place. We don't care about
   * its return value, so we annotated with void, which is compatible with any
   * return type.
   */
  constructor(size: number, create: () => T, setDefault: (obj: T) => void) {
    this.objects = []
    for (let i = 0; i < size; i++) {
      this.objects.push(create())
    }

    this.nextObject = 0
    this.frameSizes = []
    this.setDefault = setDefault
  }

  pushFrame(): void {
    this.frameSizes.push(0)
  }

  popFrame(): void {
    if (this.frameSizes.length === 0) {
      throw `no frame to pop`
    }

    this.nextObject -= this.frameSizes.pop()! // can't be undefined if length > 0
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
