import { Map, RawMap } from '~/map/interfaces'

const STORAGE_KEY = 'tools/map'

export type SaveState = {
  previous: RawMap
}

export const loadMap = (): Map | null => {
  const json = window.localStorage.getItem(STORAGE_KEY)
  if (json === null) {
    console.log('no previous map data found')
    return null
  }

  try {
    const s: SaveState = JSON.parse(json)

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (s.previous === undefined) {
      console.log('no previous map data found')
      return null
    }

    console.log('map data found')
    return Map.fromRaw(s.previous)
  } catch (error) {
    console.log(`error loading parsing map data: {$error}`)
    return null
  }
}

export const saveMap = (map: Map): void => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      previous: map,
    }),
  )
}

export const reset = (): void => {
  window.localStorage.removeItem(STORAGE_KEY)
}
