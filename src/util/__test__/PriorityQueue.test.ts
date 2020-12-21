import { shuffle } from 'lodash'

import { PriorityQueue } from '../PriorityQueue'

const permutations = <T>(values: Array<T>): Array<Array<T>> => {
  if (values.length === 0) {
    return []
  }

  if (values.length === 1) {
    return [values.slice()]
  }

  const first = values[0]
  const restPerms = permutations(values.slice(1))
  const perms: Array<Array<T>> = []

  restPerms.forEach((prevPerm) => {
    for (let insertAt = 0; insertAt < values.length; insertAt++) {
      const newPerm = []
      let prevN = 0

      while (newPerm.length < values.length) {
        if (newPerm.length === insertAt) {
          newPerm.push(first)
          continue
        }

        newPerm.push(prevPerm[prevN])
        prevN++
      }

      perms.push(newPerm)
    }
  })

  return perms
}

for (let testSize = 1; testSize < 6; testSize++) {
  const vals = [...Array(testSize).keys()]
  permutations(vals).forEach((perm) => {
    test(`pushing ${perm} should result in ${vals}`, () => {
      const pq = new PriorityQueue<number>((a, b) => a - b)
      perm.forEach((n) => pq.push(n))

      const got: Array<number> = []
      while (pq.length() !== 0) {
        got.push(pq.pop()!)
      }

      expect(got).toStrictEqual(vals)
    })
  })
}

test('works with huge inputs', () => {
  const vals = [...new Array(2048).keys()]

  const pq = new PriorityQueue<number>((a, b) => a - b)
  shuffle(vals).forEach((n) => pq.push(n))

  const got: Array<number> = []
  while (pq.length() !== 0) {
    got.push(pq.pop()!)
  }

  expect(got).toStrictEqual(vals)
})
