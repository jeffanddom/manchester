import { EntityManager } from './entities/EntityManager'
import { Playfield } from './Playfield'
import { GameMap, IGame, IKeyboard } from './interfaces'
import { TILE_SIZE } from './constants'
import { makePlayer } from './entities/Player'
import { ParticleEmitter } from './particles/ParticleEmitter'
import { makeWall } from './entities/Wall'
import { vec2 } from 'gl-matrix'
import { Keyboard } from './Keyboard'

export class Game implements IGame {
  playfield: Playfield
  entities: EntityManager
  keyboard: IKeyboard
  emitters: ParticleEmitter[]

  constructor(map: GameMap) {
    this.playfield = new Playfield(map.playfield)
    this.entities = new EntityManager()
    this.keyboard = new Keyboard()
    this.emitters = []

    // Populate entities
    const rows = map.entities.trim().split('\n')
    const width = rows[0].length
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < width; j++) {
        let entity = null
        switch (rows[i][j]) {
          case 'p':
            entity = makePlayer()
            break
          case 'w':
            entity = makeWall()
            break
          default:
            // do nothing
            break
        }

        if (entity !== null) {
          if (entity.transform !== undefined) {
            entity.transform.position = vec2.fromValues(
              j * TILE_SIZE + TILE_SIZE * 0.5,
              i * TILE_SIZE + TILE_SIZE * 0.5,
            )
          }
          this.entities.register(entity)
        }
      }
    }
  }

  update() {
    this.entities.update(this)

    this.emitters = this.emitters.filter((e) => !e.dead)
    this.emitters.forEach((e) => e.update())
  }

  render(ctx: CanvasRenderingContext2D) {
    // Clear canvas
    ctx.fillStyle = 'black'
    ctx.fillRect(
      0,
      0,
      this.playfield.pixelWidth(),
      this.playfield.pixelHeight(),
    )

    this.playfield.render(ctx)
    this.entities.render(ctx)
    this.emitters.forEach((e) => e.render(ctx))
  }
}
