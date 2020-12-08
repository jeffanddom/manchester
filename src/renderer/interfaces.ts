import { mat2d, vec2 } from 'gl-matrix'

export enum Primitive {
  PATH = 0,
  RECT = 1,
  CIRCLE = 2,
  LINE = 3,
  TEXT = 4,
}

export interface Path {
  primitive: Primitive.PATH
  fillStyle: string
  mwTransform: mat2d
  path: Array<vec2> // modelspace coordinates
}

export interface Rect {
  primitive: Primitive.RECT
  fillStyle?: string
  strokeStyle?: string
  pos: vec2 // worldspace coordinates
  dimensions: vec2
}

export interface Circle {
  primitive: Primitive.CIRCLE
  fillStyle: string
  pos: vec2 // worldspace coordinates
  radius: number
}

export interface Line {
  primitive: Primitive.LINE
  style: string
  from: vec2
  to: vec2
  width: number
}

export enum TextAlign {
  Min,
  Center,
  Max,
}

export interface Text {
  primitive: Primitive.TEXT
  style: string
  font: string
  pos: vec2
  text: string
  hAlign: TextAlign
  vAlign: TextAlign
}

export type Renderable = Path | Rect | Circle | Line | Text

export interface IRenderer {
  clear(color: string): void
  setTransform(t: mat2d): void
  setCameraWorldPos(p: vec2): void
  setGlobalOpacity(alpha: number): void
  loadTerrain(r: Renderable[]): void
  renderTerrain(): void
  render(r: Renderable): void
}
