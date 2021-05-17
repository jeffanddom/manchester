import ndarray from 'ndarray'

declare module 'l1-path-finder' {
  declare function createPlanner(grid: ndarray): L1PathPlanner

  declare class L1PathPlanner {
    search(
      tx: number,
      ty: number,
      sx: number,
      sy: number,
      path: number[],
    ): number
  }

  export = createPlanner
}
