import { mat2d, vec2 } from 'gl-matrix'

export enum Primitive2d {
  PATH = 0,
  RECT = 1,
  CIRCLE = 2,
  LINE = 3,
  TEXT = 4,
}

export interface Path {
  primitive: Primitive2d.PATH
  fillStyle: string
  mwTransform: mat2d
  path: Array<vec2> // modelspace coordinates
}

export interface Rect {
  primitive: Primitive2d.RECT
  fillStyle?: string
  strokeStyle?: string
  pos: vec2 // worldspace coordinates
  dimensions: vec2
}

export interface Circle {
  primitive: Primitive2d.CIRCLE
  fillStyle: string
  pos: vec2 // worldspace coordinates
  radius: number
}

export interface Line {
  primitive: Primitive2d.LINE
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
  primitive: Primitive2d.TEXT
  style: string
  font: string
  pos: vec2
  text: string
  hAlign: TextAlign
  vAlign: TextAlign
}

export type Renderable2d = Path | Rect | Circle | Line | Text
