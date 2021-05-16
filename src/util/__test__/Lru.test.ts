import { Lru } from '../Lru'

test('Lru', () => {
  const lru1 = new Lru<string, string>(3)
  lru1.set('key1', 'value1')
  lru1.set('key2', 'value2')
  lru1.set('key3', 'value3')

  expect(lru1.get('key1')).toBe('value1')
  expect(lru1.get('key2')).toBe('value2')
  expect(lru1.get('key3')).toBe('value3')

  lru1.set('key4', 'value4')
  expect(lru1.get('key4')).toBe('value4')
  expect(lru1.get('key1')).toBe(undefined)

  lru1.set('key4', 'value4.2')
  expect(lru1.get('key4')).toBe('value4.2')
  expect(lru1.get('key2')).toBe('value2')
  expect(lru1.get('key3')).toBe('value3')

  // Ensure that get() reprioritizes the list.
  lru1.get('key4')
  lru1.get('key2')
  lru1.set('key5', 'value5')

  expect(lru1.get('key2')).toBe('value2')
  expect(lru1.get('key4')).toBe('value4.2')
  expect(lru1.get('key5')).toBe('value5')
})
