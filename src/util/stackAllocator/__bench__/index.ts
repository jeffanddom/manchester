import { vec3 } from 'gl-matrix'

import { Vec3Allocator } from '..'
import * as time from '../../time'

import { gc, gcAvailable } from '~/util/gc'

function mean(vals: number[]): number {
  return vals.reduce((accum, v) => v + accum) / vals.length
}

export function bench(): {
  noAllocator: number
  withAllocator: number
  ratio: number
  ranGc: boolean
} {
  const noAllocator: number[] = []
  const withAllocator: number[] = []
  const ranGc = gcAvailable()
  const size = 1000000
  const trials = 5

  for (let t = 0; t < trials; t++) {
    const allocator = new Vec3Allocator(size)

    noAllocator.push(
      time.measure(() => {
        const arr = new Array(size)
        for (let i = 0; i < size; i++) {
          arr[i] = vec3.create()
        }
      }),
    )

    gc()

    withAllocator.push(
      time.measure(() => {
        const arr = new Array(size)
        allocator.pushFrame()
        for (let i = 0; i < size; i++) {
          arr[i] = allocator.allocDefault()
        }
      }),
    )

    gc()
  }

  const noAllocatorMean = mean(noAllocator)
  const withAllocatorMean = mean(withAllocator)

  return {
    noAllocator: noAllocatorMean,
    withAllocator: withAllocatorMean,
    ratio: noAllocatorMean / withAllocatorMean,
    ranGc,
  }
}
