import ndarray from 'ndarray'

declare module 'l1-path-finder' {
  export default function createPlanner(
    grid: ndarray.NdArray,
  ): l1PathFinder.Planner

  export class Planner {
    search(
      tx: number,
      ty: number,
      sx: number,
      sy: number,
      path: number[],
    ): number
  }
}
