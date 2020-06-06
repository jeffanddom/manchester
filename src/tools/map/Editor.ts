import { vec2, mat2d } from 'gl-matrix'
import * as _ from 'lodash'

import { Option } from '~util/Option'
import { Keyboard } from '~Keyboard'
import { Mouse, MouseButton } from '~Mouse'
import { Camera } from '~Camera'
import { TILE_SIZE } from '~/constants'
import * as mathutil from '~/mathutil'
import { Map, Terrain } from '~map/interfaces'
import * as entities from '~/entities'
import { IRenderer, Primitive } from '~renderer/interfaces'
import { Canvas2DRenderer } from '~renderer/Canvas2DRenderer'
import { EventEmitter } from 'events'

const CAMERA_SPEED = 500
const ZOOM_SPEED = 2

const keyMap = {
  cameraNorth: 87, // w
  cameraWest: 65, // a
  cameraSouth: 83, // s
  cameraEast: 68, // d
  zoomIn: 69, // e
  zoomOut: 81, // q
  paint: 32, // <space>
  toggleTerrain: 82, // r
  toggleEntity: 70, // f
  shift: 16, // left and right shift
}

export enum BrushMode {
  TERRAIN = 0,
  ENTITY = 1,
}

// TODO: factor these into generic functions
const TERRAIN_TYPES = [Terrain.Grass, Terrain.Mountain, Terrain.River]
const ENTITY_TYPES = [
  entities.types.Type.PLAYER,
  entities.types.Type.TURRET,
  entities.types.Type.WALL,
]

export class Editor {
  canvas: HTMLCanvasElement
  renderer: IRenderer
  events: EventEmitter

  viewportDimensions: vec2
  map: Map

  camera: Camera
  keyboard: Keyboard
  mouse: Mouse

  cursorTilePos: Option<vec2>
  brush: {
    mode: BrushMode
    terrain: Terrain
    entity: entities.types.Type
  }

  showTerrain: boolean
  showEntities: boolean
  showGrid: boolean

  constructor(params: { canvas: HTMLCanvasElement; map: Map }) {
    this.renderer = new Canvas2DRenderer(params.canvas.getContext('2d'))
    this.events = new EventEmitter()

    this.viewportDimensions = vec2.fromValues(
      params.canvas.width,
      params.canvas.height,
    )
    this.map = params.map

    this.camera = new Camera(
      this.viewportDimensions,
      vec2.scale(vec2.create(), this.map.origin, TILE_SIZE),
      vec2.scale(vec2.create(), this.map.dimensions, TILE_SIZE),
    )
    this.keyboard = new Keyboard()
    this.mouse = new Mouse(params.canvas)

    this.brush = {
      mode: BrushMode.TERRAIN,
      terrain: _.first(TERRAIN_TYPES),
      entity: _.first(ENTITY_TYPES),
    }

    this.showTerrain = true
    this.showEntities = true
    this.showGrid = true
  }

  update(dt: number): void {
    this.updateCamera(dt)
    this.updateCursor()
    this.updateBrush()
    this.keyboard.update()
  }

  updateCamera(dt: number): void {
    const cameraPos = this.camera.getPosition()

    if (this.keyboard.downKeys.has(keyMap.cameraNorth)) {
      vec2.add(cameraPos, cameraPos, [0, -CAMERA_SPEED * dt])
    } else if (this.keyboard.downKeys.has(keyMap.cameraSouth)) {
      vec2.add(cameraPos, cameraPos, [0, CAMERA_SPEED * dt])
    }

    if (this.keyboard.downKeys.has(keyMap.cameraWest)) {
      vec2.add(cameraPos, cameraPos, [-CAMERA_SPEED * dt, 0])
    } else if (this.keyboard.downKeys.has(keyMap.cameraEast)) {
      vec2.add(cameraPos, cameraPos, [CAMERA_SPEED * dt, 0])
    }

    let zoom = this.camera.getZoom()
    if (this.keyboard.downKeys.has(keyMap.zoomIn)) {
      zoom += ZOOM_SPEED * dt
    } else if (this.keyboard.downKeys.has(keyMap.zoomOut)) {
      zoom -= ZOOM_SPEED * dt
    }
    zoom = mathutil.clamp(zoom, [0.5, 3])
    this.events.emit('zoom', { zoom: zoom })

    this.camera.setZoom(zoom)
    this.camera.setPosition(cameraPos)
  }

  updateCursor(): void {
    this.cursorTilePos = this.mouse.getPos().map((viewpos) => this.v2t(viewpos))
    this.events.emit('cursorMove', { tilePos: this.cursorTilePos })
  }

  updateBrush(): void {
    if (this.keyboard.upKeys.has(keyMap.toggleTerrain)) {
      if (this.keyboard.downKeys.has(keyMap.shift)) {
        // delete terrain under cursor
        this.cursorTilePos.map((tpos) => {
          this.map.terrain[this.t2a(tpos)] = undefined
        })

        return
      }

      if (this.brush.mode === BrushMode.ENTITY) {
        this.brush.mode = BrushMode.TERRAIN
      } else {
        this.brush.terrain =
          TERRAIN_TYPES[
            (TERRAIN_TYPES.indexOf(this.brush.terrain) + 1) %
              TERRAIN_TYPES.length
          ]
      }

      this.events.emit('brushChanged', { brush: this.brush })

      return
    }

    if (this.keyboard.upKeys.has(keyMap.toggleEntity)) {
      if (this.keyboard.downKeys.has(keyMap.shift)) {
        // delete terrain under cursor
        this.cursorTilePos.map((tpos) => {
          this.map.entities[this.t2a(tpos)] = undefined
        })

        return
      }
      if (this.brush.mode === BrushMode.TERRAIN) {
        this.brush.mode = BrushMode.ENTITY
      } else {
        this.brush.entity =
          ENTITY_TYPES[
            (ENTITY_TYPES.indexOf(this.brush.entity) + 1) % ENTITY_TYPES.length
          ]
      }

      this.events.emit('brushChanged', { brush: this.brush })
      return
    }

    if (
      this.keyboard.downKeys.has(keyMap.paint) ||
      this.mouse.isDown(MouseButton.LEFT)
    ) {
      this.cursorTilePos.map((tilePos) => {
        const n = this.t2a(tilePos)

        // TODO: send these to an event stream a la Redux, for undo etc.
        switch (this.brush.mode) {
          case BrushMode.TERRAIN:
            this.map.terrain[n] = this.brush.terrain
            break
          case BrushMode.ENTITY:
            this.map.entities[n] = this.brush.entity
            break
          default:
            throw new Error(`invalid brush mode ${this.brush.mode}`)
        }

        this.events.emit('changed')
      })

      return
    }
  }

  render(): void {
    this.renderer.clear('#FCFCFC')
    this.renderer.setTransform(this.camera.wvTransform())

    if (this.showTerrain) {
      this.renderTerrain()
    }

    if (this.showEntities) {
      this.renderEntities()
    }

    if (this.showGrid) {
      this.renderGrid()
    }

    this.cursorTilePos.map((tilePos) => {
      this.renderTile(tilePos, 'rgba(0, 255, 255, 0.5)')
    })
  }

  renderTerrain(): void {
    const nwTile = this.v2t(vec2.fromValues(0, 0))
    const seTile = this.v2t(this.viewportDimensions)

    for (let i = nwTile[1]; i <= seTile[1]; i++) {
      for (let j = nwTile[0]; j <= seTile[0]; j++) {
        const n = this.t2a(vec2.fromValues(j, i))

        // TODO: need to DRY this up with playfield rendering
        switch (this.map.terrain[n]) {
          case Terrain.Grass:
            this.renderTile(vec2.fromValues(j, i), '#7EC850')
            break
          case Terrain.Mountain:
            this.renderTile(vec2.fromValues(j, i), '#5B5036')
            break
          case Terrain.River:
            this.renderTile(vec2.fromValues(j, i), '#2B5770')
            break
          default:
            // do nothing
            break
        }
      }
    }
  }

  renderEntities(): void {
    const nwTile = this.v2t(vec2.fromValues(0, 0))
    const seTile = this.v2t(this.viewportDimensions)

    for (let i = nwTile[1]; i <= seTile[1]; i++) {
      for (let j = nwTile[0]; j <= seTile[0]; j++) {
        const tpos = vec2.fromValues(j, i)
        const e = this.map.entities[this.t2a(tpos)]
        if (e === null) {
          continue
        }

        this.renderer.render({
          primitive: Primitive.PATH,
          fillStyle: entities.types.typeDefinitions[e].model.fillStyle,
          mwTransform: mat2d.fromTranslation(
            mat2d.create(),
            this.t2w(tpos, { center: true }),
          ),
          path: entities.types.typeDefinitions[e].model.path,
        })
      }
    }
  }

  /**
   * Convert the given viewspace position into a worldspace position, expressed
   * in tile units.
   */
  v2t(vpos: vec2): vec2 {
    const wp = vec2.transformMat2d(
      vec2.create(),
      vpos,
      mat2d.invert(mat2d.create(), this.camera.wvTransform()),
    )

    return vec2.floor(
      vec2.create(),
      vec2.scale(vec2.create(), wp, 1 / TILE_SIZE),
    )
  }

  /**
   * Convert the given worldspace position in tile units to a flat array offset.
   */
  t2a(tpos: vec2): number {
    const p = vec2.sub(vec2.create(), tpos, this.map.origin)
    return p[1] * this.map.dimensions[0] + p[0]
  }

  renderTile(tpos: vec2, fillStyle: string): void {
    this.renderer.render({
      primitive: Primitive.RECT,
      fillStyle: fillStyle,
      pos: this.t2w(tpos),
      dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
    })
  }

  /**
   * Convert the given tile position to a worldspace position.
   */
  t2w(tpos: vec2, { center }: { center: boolean } = { center: false }): vec2 {
    const w = vec2.scale(vec2.create(), tpos, TILE_SIZE)
    if (center) {
      vec2.add(w, w, vec2.fromValues(TILE_SIZE / 2, TILE_SIZE / 2))
    }
    return w
  }

  renderGrid(): void {
    const axisWeight = 2
    const nonaxisWeight = 1
    const [visibleMin, visibleMax] = this.camera.getVisibleMinMax()

    for (let i = 0; i < this.map.dimensions[1]; i++) {
      const y = (i + this.map.origin[1]) * TILE_SIZE
      this.renderer.render({
        primitive: Primitive.LINE,
        style: '#DDDDDD',
        width: y === 0 ? axisWeight : nonaxisWeight,
        from: vec2.fromValues(visibleMin[0], y),
        to: vec2.fromValues(visibleMax[0], y),
      })
    }

    for (let j = 0; j < this.map.dimensions[0]; j++) {
      const x = (j + this.map.origin[0]) * TILE_SIZE
      this.renderer.render({
        primitive: Primitive.LINE,
        style: '#DDDDDD',
        width: x === 0 ? axisWeight : nonaxisWeight,
        from: vec2.fromValues(x, visibleMin[1]),
        to: vec2.fromValues(x, visibleMax[1]),
      })
    }
  }
}
