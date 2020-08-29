import { some } from 'lodash'

import { Team } from '~/components/team'
import { Game, GameState } from '~/Game'

export const update = (g: Game): void => {
  const levelComplete = !some(
    g.server.entityManager.entities,
    (e) => e.team === Team.Enemy,
  )

  if (levelComplete) {
    g.setState(GameState.LevelComplete)
  }
}
