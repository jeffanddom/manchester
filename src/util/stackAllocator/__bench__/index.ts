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

    gc()
    let arr = new Array(size)

    noAllocator.push(
      time.measure(() => {
        for (let i = 0; i < size; i++) {
          arr[i] = vec3.create()
        }
      }),
    )

    gc()
    arr = new Array(size)

    withAllocator.push(
      time.measure(() => {
        for (let i = 0; i < size; i++) {
          allocator.pushFrame()
          arr[i] = allocator.allocDefault()
          allocator.popFrame()
        }
      }),
    )
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
