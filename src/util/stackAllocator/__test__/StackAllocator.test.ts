import { StackAllocator } from '../StackAllocator'

class TestAllocator extends StackAllocator<{ value: number }> {
  constructor(size: number) {
    super(
      size,
      () => ({ value: 0 }),
      (obj) => {
        obj.value = 0
        return obj
      },
    )
  }
}

describe('StackAllocator', () => {
  test('popFrame() adds capacity', () => {
    const allocator = new TestAllocator(5)

    allocator.pushFrame()

    for (let i = 0; i < 5; i++) {
      allocator.allocDirty()
    }

    expect(() => allocator.allocDirty()).toThrow()

    allocator.popFrame()
    allocator.pushFrame()

    expect(() => allocator.allocDirty()).not.toThrow()
  })

  test('must push an initial frame', () => {
    const allocator = new TestAllocator(5)
    expect(() => allocator.allocDirty()).toThrow()
    allocator.pushFrame()
    expect(() => allocator.allocDirty()).not.toThrow()
  })

  test('multiple frames', () => {
    const allocator = new TestAllocator(5)

    allocator.pushFrame()
    allocator.allocDirty()

    allocator.pushFrame()
    allocator.allocDirty()
    allocator.allocDirty()

    allocator.pushFrame()
    allocator.allocDirty()
    allocator.allocDirty()

    expect(() => allocator.allocDirty()).toThrow()

    allocator.popFrame()
    allocator.allocDirty()
    allocator.allocDirty()
    expect(() => allocator.allocDirty()).toThrow()

    allocator.popFrame()
    allocator.allocDirty()
    allocator.allocDirty()
    allocator.allocDirty()
    allocator.allocDirty()
    expect(() => allocator.allocDirty()).toThrow()

    allocator.popFrame()
    allocator.pushFrame()
    allocator.allocDirty()
    allocator.allocDirty()
    allocator.allocDirty()
    allocator.allocDirty()
    allocator.allocDirty()
    expect(() => allocator.allocDirty()).toThrow()
  })

  test('allocDirty does not re-initialize values', () => {
    const allocator = new TestAllocator(5)
    allocator.pushFrame()

    for (let i = 0; i < 5; i++) {
      const obj = allocator.allocDirty()
      obj.value = i + 1
    }

    allocator.popFrame()
    allocator.pushFrame()

    for (let i = 0; i < 5; i++) {
      const obj = allocator.allocDirty()
      expect(obj.value).toStrictEqual(i + 1)
    }
  })

  test('allocDefault does not re-initialize values', () => {
    const allocator = new TestAllocator(5)
    allocator.pushFrame()

    for (let i = 0; i < 5; i++) {
      const obj = allocator.allocDirty()
      obj.value = i + 1
    }

    allocator.popFrame()
    allocator.pushFrame()

    for (let i = 0; i < 5; i++) {
      const obj = allocator.allocDefault()
      expect(obj.value).toStrictEqual(0)
    }
  })
})
