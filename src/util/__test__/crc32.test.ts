import { crc32 } from '../crc32'

test('crc32', () => {
  // samples are from https://crc32.online
  const cases: [string, number][] = [
    ['123456789', 0xcbf43926],
    ['the quick brown fox jumped over the lazy dog', 0xe188ecd9],
  ]

  for (const c of cases) {
    expect(crc32(Buffer.from(c[0]))).toBe(c[1])
  }
})
