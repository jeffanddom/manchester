import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { vec2 } from 'gl-matrix'

import { Controls } from '~tools/map/Controls'
import * as time from '~/time'
import { Editor } from './Editor'
import { Map } from '~map/interfaces'

const canvas = document.createElement('canvas')
document.getElementById('editor').prepend(canvas)
canvas.width = 400
canvas.height = 400

const editor = new Editor({
  canvas: canvas,
  map: new Map(vec2.fromValues(64, 64)),
})

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
