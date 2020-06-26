import { Game } from '~/Game'

export const update = (g: Game, dt: number): void => {
  for (const id in g.entities.entities) {
    const e = g.entities.entities[id]
    if (!e.transform || !e.motionScript) {
      continue
    }

    e.motionScript.update(e.transform, id, g, dt)
  }
}
