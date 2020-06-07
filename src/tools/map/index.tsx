import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { vec2 } from 'gl-matrix'

import { Controls } from '~tools/map/Controls'
import * as time from '~util/time'
import { Editor } from './Editor'
import { RawMap, Map } from '~map/interfaces'

type SaveState = {
  previous: RawMap
}

const canvas = document.createElement('canvas')
document.getElementById('editor')!.prepend(canvas)
canvas.width = 400
canvas.height = 400

// Load map
const json = window.localStorage.getItem('tools/map')
let map = null
if (json !== null) {
  try {
    const s: SaveState = JSON.parse(json)
    if (s.previous !== undefined) {
      map = Map.fromRaw(s.previous)
    }
  } catch (error) {
    console.log(`error loading save state: {$error}`)
  }
}

if (map !== null) {
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
