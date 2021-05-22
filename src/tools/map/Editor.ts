import { EventEmitter } from 'events'

import { mat2d, vec2 } from 'gl-matrix'

import { IKeyboard } from '~/engine/input/interfaces'
import { IMouse, MouseButton } from '~/engine/input/interfaces'
import { Map } from '~/engine/map/interfaces'
import { Primitive2d, Renderer2d } from '~/engine/renderer/Renderer2d'
import * as terrain from '~/engine/terrain'
import { TILE_SIZE } from '~/game/constants'
import * as entities from '~/game/entities'
import { Camera2d } from '~/tools/map/Camera2d'
import * as math from '~/util/math'

const CAMERA_SPEED = 500
const ZOOM_SPEED = 2

const keyMap = {
  cameraNorth: 'KeyW', // w
  cameraWest: 'KeyA', // a
  cameraSouth: 'KeyS', // s
  cameraEast: 'KeyD', // d
  zoomIn: 'KeyE', // e
  zoomOut: 'KeyQ', // q
  paint: 'Space', // <space>
  toggleTerrain: 'KeyR', // r
  toggleEntity: 'KeyF', // f
  shift: 'ShiftLeft',
}

export enum BrushMode {
  TERRAIN = 0,
  ENTITY = 1,
}

// TODO: factor these into generic functions
const TERRAIN_TYPES = [
  terrain.Type.Grass,
  terrain.Type.Mountain,
  terrain.Type.River,
]
const ENTITY_TYPES = Object.values(entities.types.Type)

export class Editor {
  renderer: Renderer2d
  events: EventEmitter

  viewportDimensions: vec2
  map: Map
  terrain: terrain.Layer

  camera: Camera2d
  keyboard: IKeyboard
  mouse: IMouse

  cursorTilePos: vec2 | undefined
  brush: {
    mode: BrushMode
    terrain: terrain.Type
    entity: entities.types.Type
  }

  showTerrain: boolean
  showEntities: boolean
  showGrid: boolean

  constructor(params: {
    canvas: HTMLCanvasElement
    map: Map
    keyboard: IKeyboard
    mouse: IMouse
  }) {
    this.renderer = new Renderer2d(params.canvas.getContext('2d')!)
    this.events = new EventEmitter()

    this.viewportDimensions = vec2.fromValues(
      params.canvas.width,
      params.canvas.height,
    )
    this.map = params.map
    this.terrain = new terrain.Layer({
      tileOrigin: this.map.origin,
      tileDimensions: this.map.dimensions,
      terrain: this.map.terrain,
    })

    this.camera = new Camera2d(
      this.viewportDimensions,
      vec2.scale(vec2.create(), this.map.origin, TILE_SIZE),
      vec2.scale(vec2.create(), this.map.dimensions, TILE_SIZE),
    )
    this.keyboard = params.keyboard
    this.mouse = params.mouse

    this.cursorTilePos = undefined
    this.brush = {
      mode: BrushMode.TERRAIN,
      terrain: TERRAIN_TYPES[0],
      entity: ENTITY_TYPES[0],
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

    if (this.keyboard.heldkeys.has(keyMap.cameraNorth)) {
      vec2.add(cameraPos, cameraPos, [0, -CAMERA_SPEED * dt])
    } else if (this.keyboard.heldkeys.has(keyMap.cameraSouth)) {
      vec2.add(cameraPos, cameraPos, [0, CAMERA_SPEED * dt])
    }

    if (this.keyboard.heldkeys.has(keyMap.cameraWest)) {
      vec2.add(cameraPos, cameraPos, [-CAMERA_SPEED * dt, 0])
    } else if (this.keyboard.heldkeys.has(keyMap.cameraEast)) {
      vec2.add(cameraPos, cameraPos, [CAMERA_SPEED * dt, 0])
    }

    let zoom = this.camera.getZoom()
    if (this.keyboard.heldkeys.has(keyMap.zoomIn)) {
      zoom += ZOOM_SPEED * dt
    } else if (this.keyboard.heldkeys.has(keyMap.zoomOut)) {
      zoom -= ZOOM_SPEED * dt
    }
    zoom = math.clamp(zoom, 0.5, 3)
    this.events.emit('zoom', { zoom: zoom })

    this.camera.setZoom(zoom)
    this.camera.setPosition(cameraPos)
  }

  updateCursor(): void {
    const mousePos = this.mouse.getPos()
    if (mousePos !== undefined) {
      this.cursorTilePos = this.v2t(mousePos)
    }
    this.events.emit('cursorMove', { tilePos: this.cursorTilePos })
  }

  updateBrush(): void {
    if (this.keyboard.upKeys.has(keyMap.toggleTerrain)) {
      if (this.keyboard.heldkeys.has(keyMap.shift)) {
        // delete terrain under cursor
        if (this.cursorTilePos !== undefined) {
          this.map.terrain[this.t2a(this.cursorTilePos)] = null
        }

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
      if (this.keyboard.heldkeys.has(keyMap.shift)) {
        // delete terrain under cursor
        if (this.cursorTilePos !== undefined) {
          this.map.entities[this.t2a(this.cursorTilePos)] = null
        }

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
      this.keyboard.heldkeys.has(keyMap.paint) ||
      this.mouse.isHeld(MouseButton.LEFT)
    ) {
      if (this.cursorTilePos !== undefined) {
        const n = this.t2a(this.cursorTilePos)

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
      }

      return
    }
  }

  render(): void {
    this.renderer.clear()
    this.renderer.setTransform(this.camera.wvTransform())

    if (this.showTerrain) {
      // this.renderTerrain()
    }

    if (this.showEntities) {
      this.renderEntities()
    }

    if (this.showGrid) {
      this.renderGrid()
    }

    if (this.cursorTilePos !== undefined) {
      this.renderTile(this.cursorTilePos, 'rgba(0, 255, 255, 0.5)')
    }
  }

  // renderTerrain(): void {
  //   this.terrain
  //     .getRenderables(this.camera.getVisibleExtents())
  //     .forEach((r) => this.renderer.render(r))
  // }

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

        // toRenderables(entities.types.typeDefinitions[e].editorModel, {
        //   worldTransform: mat2d.fromTranslation(
        //     mat2d.create(),
        //     this.t2w(tpos, { center: true }),
        //   ),
        // }).forEach((r) => this.renderer.render(r))
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
      primitive: Primitive2d.RECT,
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
    const [visibleMin, visibleMax] = this.camera.getVisibleExtents()

    for (let i = 0; i < this.map.dimensions[1]; i++) {
      const y = (i + this.map.origin[1]) * TILE_SIZE
      this.renderer.render({
        primitive: Primitive2d.LINE,
        style: '#DDDDDD',
        width: y === 0 ? axisWeight : nonaxisWeight,
        from: vec2.fromValues(visibleMin[0], y),
        to: vec2.fromValues(visibleMax[0], y),
      })
    }

    for (let j = 0; j < this.map.dimensions[0]; j++) {
      const x = (j + this.map.origin[0]) * TILE_SIZE
      this.renderer.render({
        primitive: Primitive2d.LINE,
        style: '#DDDDDD',
        width: x === 0 ? axisWeight : nonaxisWeight,
        from: vec2.fromValues(x, visibleMin[1]),
        to: vec2.fromValues(x, visibleMax[1]),
      })
    }
  }
}
