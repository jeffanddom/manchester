import { ComponentTable } from '~/engine/sim/ComponentTable'
import { EntityId } from '~/engine/sim/EntityId'

type TestEntry = {
  value: number
}

describe('ComponentTable', () => {
  it('#get', () => {
    const table = new ComponentTable<TestEntry>((c) => ({ value: c.value }))

    table.set(0 as EntityId, { value: 0 })
    table.set(1 as EntityId, { value: 1 })

    expect(table.get(0 as EntityId)).toStrictEqual({ value: 0 })
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1 })
    expect(table.get(2 as EntityId)).toBeUndefined()

    table.set(1 as EntityId, { value: 1111 }) // okay to replace similar IDs
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1111 })
  })

  it('#has', () => {
    const table = new ComponentTable<TestEntry>((c) => ({ value: c.value }))

    table.set(0 as EntityId, { value: 0 })
    table.set(1 as EntityId, { value: 1 })

    expect(table.has(0 as EntityId)).toBe(true)
    expect(table.has(1 as EntityId)).toBe(true)
    expect(table.has(2 as EntityId)).toBe(false)
  })

  it('#delete', () => {
    const table = new ComponentTable<TestEntry>((c) => ({ value: c.value }))

    table.set(0 as EntityId, { value: 0 })
    table.set(1 as EntityId, { value: 1 })
    table.delete(0 as EntityId)
    table.delete(2 as EntityId) // okay to delete non-existent IDs

    expect(table.has(0 as EntityId)).toBe(false)
    expect(table.has(1 as EntityId)).toBe(true)
  })

  it('iteration', () => {
    const table = new ComponentTable<TestEntry>((c) => ({ value: c.value }))

    table.set(0 as EntityId, { value: 0 })
    table.set(1 as EntityId, { value: 1 })
    table.set(2 as EntityId, { value: 2 })

    expect([...table]).toStrictEqual([
      [0 as EntityId, { value: 0 }],
      [1 as EntityId, { value: 1 }],
      [2 as EntityId, { value: 2 }],
    ])
  })

  it('#update', () => {
    const table = new ComponentTable<TestEntry>((c) => ({ value: c.value }))

    table.set(1 as EntityId, { value: 1 })
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1 })

    table.update(1 as EntityId, { value: 1111 })
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1111 })
  })

  it('commit/rollback', () => {
    const table = new ComponentTable<TestEntry>((c) => ({ value: c.value }))

    table.set(0 as EntityId, { value: 0 })
    expect(table.has(0 as EntityId)).toBe(true)

    table.commit()
    expect(table.has(0 as EntityId)).toBe(true)

    table.set(1 as EntityId, { value: 1 })
    expect(table.has(1 as EntityId)).toBe(true)

    table.rollback()
    expect(table.has(0 as EntityId)).toBe(true)
    expect(table.has(1 as EntityId)).toBe(false)

    table.set(1 as EntityId, { value: 1 })
    expect(table.has(1 as EntityId)).toBe(true)

    table.commit()
    expect(table.has(1 as EntityId)).toBe(true)

    table.rollback()
    expect(table.has(1 as EntityId)).toBe(true)

    table.update(1 as EntityId, { value: 1111 })
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1111 })

    table.rollback()
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1 })

    table.update(1 as EntityId, { value: 1111 })
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1111 })

    table.commit()
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1111 })

    table.rollback()
    expect(table.get(1 as EntityId)).toStrictEqual({ value: 1111 })

    // update after set, no commit

    table.set(2 as EntityId, { value: 2 })
    expect(table.get(2 as EntityId)).toStrictEqual({ value: 2 })

    table.update(2 as EntityId, { value: 2222 })
    expect(table.get(2 as EntityId)).toStrictEqual({ value: 2222 })

    table.rollback()
    expect(table.get(2 as EntityId)).toBeUndefined()
  })
})
