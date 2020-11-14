import { EntitySet } from './EntitySet'

import { EntityId } from '~/entities/EntityId'

describe('EntitySet', () => {
  it('#has', () => {
    const table = new EntitySet()

    table.add(0 as EntityId)
    table.add(1 as EntityId)

    expect(table.has(0 as EntityId)).toBe(true)
    expect(table.has(1 as EntityId)).toBe(true)
    expect(table.has(2 as EntityId)).toBe(false)
  })

  it('#delete', () => {
    const table = new EntitySet()

    table.add(0 as EntityId)
    table.add(1 as EntityId)
    table.delete(0 as EntityId)
    table.delete(2 as EntityId) // okay to delete non-existent IDs

    expect(table.has(0 as EntityId)).toBe(false)
    expect(table.has(1 as EntityId)).toBe(true)
  })

  it('iteration', () => {
    const table = new EntitySet()

    table.add(0 as EntityId)
    table.add(1 as EntityId)
    table.add(2 as EntityId)

    expect([...table]).toStrictEqual([
      0 as EntityId,
      1 as EntityId,
      2 as EntityId,
    ])
  })

  it('commit/rollback', () => {
    const table = new EntitySet()

    table.add(0 as EntityId)
    expect(table.has(0 as EntityId)).toBe(true)

    table.commit()
    expect(table.has(0 as EntityId)).toBe(true)

    table.add(1 as EntityId)
    expect(table.has(1 as EntityId)).toBe(true)

    table.rollback()
    expect(table.has(0 as EntityId)).toBe(true)
    expect(table.has(1 as EntityId)).toBe(false)

    table.add(1 as EntityId)
    expect(table.has(1 as EntityId)).toBe(true)

    table.commit()
    expect(table.has(1 as EntityId)).toBe(true)

    table.rollback()
    expect(table.has(1 as EntityId)).toBe(true)
  })
})
