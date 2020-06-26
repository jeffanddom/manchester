import { Map, RawMap } from '~/map/interfaces'
import { None, Option, Some } from '~/util/Option'

export type SaveState = {
  previous: RawMap
}

export const loadMap = (): Option<Map> => {
  const json = window.localStorage.getItem('tools/map')
  if (json === null) {
    console.log('no previous map data found')
    return None()
  }

  try {
    const s: SaveState = JSON.parse(json)
    if (s.previous === undefined) {
      console.log('no previous map data found')
      return None()
    }

    console.log('map data found')
    return Some(Map.fromRaw(s.previous))
  } catch (error) {
    console.log(`error loading parsing map data: {$error}`)
    return None()
  }
}

export const saveMap = (map: Map): void => {
  window.localStorage.setItem(
    'tools/map',
    JSON.stringify({
      previous: map,
    }),
  )
}
