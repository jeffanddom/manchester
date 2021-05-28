export enum MapTileType {
  GRASS,
  RIVER,
  MOUNTAIN,
}

export interface EditorMap {
  width: number
  height: number
  tiles: Uint8Array
}

export const cloneMap = (c: EditorMap): EditorMap => {
  return {
    width: c.width,
    height: c.height,
    tiles: c.tiles.slice(),
  }
}
