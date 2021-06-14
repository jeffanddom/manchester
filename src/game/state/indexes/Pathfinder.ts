import { jps } from '~/util/jps'

/**
 * TODO: new pathfinder
 * GOAL: do diagonals
 *
 * Preprocessing:
 * - list of waypoints (exterior corners)
 * - connect waypoints by line of sight
 * - for every non-waypoint open tile, get list of waypoints that have line of sight
 *   - this seems dicey
 *   - do this lazily and cache
 *
 * Actual search:
 * - Extend graph with source and destination
 * - Just do euclidean A*
 * - Maybe figure out a way not to cheat around corners
 */

export class Pathfinder {
  private grid: Uint8Array
  private gridWidth: number

  private worldToGridOffsetX: number
  private worldToGridOffsetY: number

  public constructor(config: {
    width: number
    height: number
    worldToGridOffsetX: number
    worldToGridOffsetY: number
  }) {
    this.grid = new Uint8Array(config.width * config.height)
    this.gridWidth = config.width

    this.worldToGridOffsetX = config.worldToGridOffsetX
    this.worldToGridOffsetY = config.worldToGridOffsetY
  }

  public setOn(worldX: number, worldY: number): void {
    const p =
      (worldY + this.worldToGridOffsetY) * this.gridWidth +
      worldX +
      this.worldToGridOffsetX
    this.grid[p] = 1
  }

  public setOff(worldX: number, worldY: number): void {
    const p =
      (worldY + this.worldToGridOffsetY) * this.gridWidth +
      worldX +
      this.worldToGridOffsetX
    this.grid[p] = 0
  }

  public getPath(
    srcX: number,
    srcY: number,
    dstX: number,
    dstY: number,
  ): number[] | undefined {
    const path = jps(
      srcX + this.worldToGridOffsetX,
      srcY + this.worldToGridOffsetY,
      dstX + this.worldToGridOffsetX,
      dstY + this.worldToGridOffsetY,
      this.grid,
      this.gridWidth,
    )
    if (path === undefined) {
      return undefined
    }

    for (let i = 0; i < path.length; i += 2) {
      path[i] -= this.worldToGridOffsetX
      path[i + 1] -= this.worldToGridOffsetY
    }

    return path
  }
}
