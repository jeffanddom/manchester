import { StackAllocator } from '../StackAllocator'

class TestAllocator extends StackAllocator<{ value: number }> {
  constructor(size: number, opts: { debug: boolean } = { debug: false }) {
    super({
      size,
      create: () => ({ value: 0 }),
      setDefault: (obj) => {
        obj.value = 0
      },
      setFree: opts.debug ? (obj) => (obj.value = 696969.696969) : undefined,
    })
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

  test('allocDefault re-initializes values', () => {
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

  test('use-after-free detection', () => {
    const allocator = new TestAllocator(3, { debug: true })

    allocator.pushFrame()
    const a = allocator.allocDefault()

    allocator.pushFrame()
    const b = allocator.allocDefault()
    const c = allocator.allocDefault()

    expect(a.value).toBe(0)
    expect(b.value).toBe(0)
    expect(c.value).toBe(0)

    allocator.popFrame()

    expect(a.value).toBe(0)
    expect(b.value).toBe(696969.696969)
    expect(c.value).toBe(696969.696969)
  })
})
