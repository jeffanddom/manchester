import { maps } from '~/assets/maps'

export enum GameState {
  None,
  Running,
  YouDied,
  LevelComplete,
}

export const gameProgression = [maps.bigMap, maps.collisionTest]
