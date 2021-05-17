import createPlanner, { Planner } from 'l1-path-finder'
import ndarray from 'ndarray'

import { crc32 } from '~/util/crc32'
import { Lru } from '~/util/Lru'

export class Pathfinder {
  private grid: ndarray.NdArray
  private planner: Planner
  private dirty: boolean
  private worldToGridOffsetX: number
  private worldToGridOffsetY: number
  private plannerCache: Lru<number, Planner>

  public constructor(config: {
    width: number
    height: number
    worldToGridOffsetX: number
    worldToGridOffsetY: number
  }) {
    this.grid = ndarray(new Uint8Array(config.width * config.height), [
      config.width,
      config.height,
    ])
    this.planner = createPlanner(this.grid)
    this.dirty = false
    this.worldToGridOffsetX = config.worldToGridOffsetX
    this.worldToGridOffsetY = config.worldToGridOffsetY

    // For now, let's assume that a cache with ten entries using CRC32 has a
    // sufficiently low chance of collision. If this turns out to be a problem,
    // then we should consider using a noncryptographic hash with a larger
    // range.
    this.plannerCache = new Lru(10)
  }

  public setOn(worldX: number, worldY: number): void {
    this.grid.set(
      worldX + this.worldToGridOffsetX,
      worldY + this.worldToGridOffsetY,
      1,
    )
    this.dirty = true
  }

  public setOff(worldX: number, worldY: number): void {
    this.grid.set(
      worldX + this.worldToGridOffsetX,
      worldY + this.worldToGridOffsetY,
      0,
    )
    this.dirty = true
  }

  public frameUpdate(): void {
    if (!this.dirty) {
      return
    }

    const checksum = this.getGridChecksum()
    const planner = this.plannerCache.get(checksum)
    if (planner !== undefined) {
      this.planner = planner
    } else {
      this.planner = createPlanner(this.grid)
      this.plannerCache.set(checksum, this.planner)
    }

    this.dirty = false
  }

  public getPath(
    srcX: number,
    srcY: number,
    dstX: number,
    dstY: number,
  ): number[] | undefined {
    const path: number[] = []

    this.planner.search(
      srcX + this.worldToGridOffsetX,
      srcY + this.worldToGridOffsetY,
      dstX + this.worldToGridOffsetX,
      dstY + this.worldToGridOffsetY,
      path,
    )

    if (path.length === 0) {
      return undefined
    }

    for (let i = 0; i < path.length; i += 2) {
      path[i] -= this.worldToGridOffsetX
      path[i + 1] -= this.worldToGridOffsetY
    }

    return path
  }

  private getGridChecksum(): number {
    return crc32(this.grid.data as Uint8Array)
  }
}
