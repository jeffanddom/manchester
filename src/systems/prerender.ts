import { Game } from '~/Game'

export const update = (g: Game): void => {
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.prerenderLogic) {
      continue
    }
    e.prerenderLogic.update(id, g)
  }
}
