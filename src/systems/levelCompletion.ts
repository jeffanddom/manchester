import { some } from 'lodash'

import { Team } from '~/entities/team'
import { Game, GameState } from '~/Game'

export const update = (g: Game): void => {
  const levelComplete = !some(g.entities.entities, (e) => e.team === Team.Enemy)

  if (levelComplete) {
    g.setState(GameState.LevelComplete)
  }
}
