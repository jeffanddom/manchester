import { vec2 } from 'gl-matrix'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { loadMap } from './storage'

import { Map } from '~/map/interfaces'
import { Controls } from '~/tools/map/Controls'
import { Editor } from '~/tools/map/Editor'
import * as time from '~/util/time'

const canvas = document.createElement('canvas')
document.getElementById('editor')!.prepend(canvas)
canvas.width = 400
canvas.height = 400

let map = loadMap()
if (map) {
  console.log('loaded map from storage')
} else {
  console.log('no saved map in storage')
  map = new Map(vec2.fromValues(64, 64))
}

const editor = new Editor({ canvas, map })

let prevFrameTime = time.current()
function gameLoop() {
  requestAnimationFrame(gameLoop)

  const now = time.current()
  const dt = now - prevFrameTime
  prevFrameTime = now

  editor.update(dt)
  editor.render()
}

gameLoop()

const htmlNode = document.getElementById('controls')
ReactDOM.render(<Controls editor={editor} />, htmlNode)
