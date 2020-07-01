const STORAGE_KEY = 'game/mapName'

export const getCurrentMap = (): string | null => {
  return window.localStorage.getItem(STORAGE_KEY)
}

export const setCurrentMap = (mapName: string): void => {
  window.localStorage.setItem(STORAGE_KEY, mapName)
}
