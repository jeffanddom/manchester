import { EntityManager } from './EntityManager'
import { Playfield } from './Playfield'
import { GameMap, TILE_SIZE, IGame, IKeyboard, IWallCollider } from './common'
import { Player } from './Player'
import { Wall } from './Wall'
import { vec2 } from 'gl-matrix'
import { Keyboard } from './Keyboard'

export class Game implements IGame {
  playfield: Playfield
  entities: EntityManager
  keyboard: IKeyboard

  constructor(map: GameMap) {
    this.playfield = new Playfield(map.playfield)
    this.entities = new EntityManager(this)
    this.keyboard = new Keyboard()

    // Populate entities
    const rows = map.entities.trim().split('\n')
    const width = rows[0].length
    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < width; j++) {
        let entity = null
        switch (rows[i][j]) {
          case 'p':
            entity = new Player()
            break
          case 'w':
            entity = new Wall()
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

    const player = new Player()
  }

  update() {
    // Collide moving entities with walls

    // Collide bullets with bullet-hittable entities

    this.entities.update()
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
  }
}
