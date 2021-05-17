import createPlanner, { Planner } from 'l1-path-finder'
import ndarray from 'ndarray'

export class Pathfinder {
  private grid: ndarray.NdArray
  private planner: Planner
  private dirty: boolean
  private worldToGridOffsetX: number
  private worldToGridOffsetY: number

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
    this.worldToGridOffsetX = config.worldToGridOffsetX
    this.worldToGridOffsetY = config.worldToGridOffsetY
    this.dirty = false
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

    this.planner = createPlanner(this.grid)
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
}
