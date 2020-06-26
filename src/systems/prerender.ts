import { Game } from '~/Game'

export const update = (g: Game): void => {
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.prerenderScript) {
      continue
    }
    e.prerenderScript.update(id, g)
  }
}
