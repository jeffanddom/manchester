import { vec2, mat2d } from 'gl-matrix'
import * as _ from 'lodash'

import { Keyboard } from '~Keyboard'
import { Mouse, MouseButton } from '~Mouse'
import { Camera } from '~Camera'
import { TILE_SIZE } from '~/constants'
import * as mathutil from '~/mathutil'
import { path2 } from '~/path2'
import { Map, Terrain } from '~map/interfaces'
import * as entities from '~/entities'
import { IRenderer, Primitive } from '~renderer/interfaces'
import { Canvas2DRenderer } from '~renderer/Canvas2DRenderer'

const CAMERA_SPEED = 500
const ZOOM_SPEED = 2
const TILE_PATH = path2.fromValues([
  [0, 0],
  [TILE_SIZE, 0],
  [TILE_SIZE, TILE_SIZE],
  [0, TILE_SIZE],
])

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
}

enum BrushMode {
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

  viewportDimensions: vec2
  map: Map
  mapTileOrigin: vec2
  mapTileDimensions: vec2

  camera: Camera
  keyboard: Keyboard
  mouse: Mouse

  brushMode: BrushMode
  terrainBrush: Terrain
  entityBrush: entities.types.Type

  constructor(params: { canvas: HTMLCanvasElement; map: Map }) {
    this.renderer = new Canvas2DRenderer(params.canvas.getContext('2d'))

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

    this.brushMode = BrushMode.TERRAIN
    this.terrainBrush = _.first(TERRAIN_TYPES)
    this.entityBrush = _.first(ENTITY_TYPES)
  }

  update(dt: number): void {
    this.updateCamera(dt)
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

    this.camera.setZoom(mathutil.clamp(zoom, [0.5, 3]))
    this.camera.setPosition(cameraPos)
  }

  updateBrush(): void {
    if (this.keyboard.upKeys.has(keyMap.toggleTerrain)) {
      if (this.brushMode === BrushMode.ENTITY) {
        this.brushMode = BrushMode.TERRAIN
      } else {
        this.terrainBrush =
          TERRAIN_TYPES[
            (TERRAIN_TYPES.indexOf(this.terrainBrush) + 1) %
              TERRAIN_TYPES.length
          ]
      }

      // TODO: show visual feedback for this
      console.log(this.brushMode)
      console.log(this.terrainBrush)
    } else if (this.keyboard.upKeys.has(keyMap.toggleEntity)) {
      if (this.brushMode === BrushMode.TERRAIN) {
        this.brushMode = BrushMode.ENTITY
      } else {
        this.entityBrush =
          ENTITY_TYPES[
            (ENTITY_TYPES.indexOf(this.entityBrush) + 1) % ENTITY_TYPES.length
          ]
      }

      // TODO: show visual feedback for this
      console.log(this.brushMode)
      console.log(this.entityBrush)
    } else if (
      this.keyboard.downKeys.has(keyMap.paint) ||
      this.mouse.isDown(MouseButton.LEFT)
    ) {
      // TODO: send these to an event stream a la Redux.
      const brushTile = this.getCursorTilePos()
      if (brushTile !== undefined) {
        const n = this.t2a(brushTile)
        switch (this.brushMode) {
          case BrushMode.TERRAIN:
            this.map.terrain[n] = this.terrainBrush
            break
          case BrushMode.ENTITY:
            this.map.entities[n] = this.entityBrush
            break
          default:
            throw new Error(`invalid brush mode ${this.brushMode}`)
        }
      }
    }
  }

  render(): void {
    this.renderer.clear('#FCFCFC')
    this.renderer.setTransform(this.camera.wvTransform())

    this.renderTerrain()
    this.renderGrid()

    const cursorPos = this.getCursorTilePos()
    if (cursorPos !== undefined) {
      this.renderTile(cursorPos, 'rgba(0, 255, 255, 0.5)')
    }
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

  /**
   * Return the tile position of the mouse cursor. Returns undefined if the
   * mouse cursor is not over the viewport.
   */
  getCursorTilePos(): vec2 | undefined {
    const vpos = this.mouse.getPos()
    if (vpos === undefined) {
      return undefined
    }
    return this.v2t(vpos)
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
   * Conver the given worldspace position in tile units to a flat array offset.
   */
  t2a(tpos: vec2): number {
    const p = vec2.sub(vec2.create(), tpos, this.map.origin)
    return p[1] * this.map.dimensions[0] + p[0]
  }

  renderTile(tpos: vec2, fillStyle: string): void {
    this.renderer.render({
      primitive: Primitive.RECT,
      fillStyle: fillStyle,
      pos: vec2.scale(vec2.create(), tpos, TILE_SIZE),
      dimensions: vec2.fromValues(TILE_SIZE, TILE_SIZE),
    })
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
