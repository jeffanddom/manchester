import { saveAs } from 'file-saver'
import { vec2 } from 'gl-matrix'
import * as React from 'react'
import { ReactElement, useRef, useState } from 'react'

import { reset, saveMap } from './storage'

import * as terrain from '~/engine/terrain'
import { TILE_SIZE } from '~/game/constants'
import * as entities from '~/game/entities'
import { Map } from '~/game/map/interfaces'
import { BrushMode, Editor } from '~/tools/map/Editor'

export const Controls = ({ editor }: { editor: Editor }): ReactElement => {
  const initialState: {
    zoom: number
    map: Map
    tilePos: vec2 | undefined
    brush: {
      mode: BrushMode
      terrain: terrain.Type
      entity: entities.types.Type
    }
    showTerrain: boolean
    showEntities: boolean
    showGrid: boolean
    fileOperationInProgress: boolean
  } = {
    zoom: 1,
    map: editor.map,
    tilePos: undefined,
    brush: editor.brush,
    showTerrain: true,
    showEntities: true,
    showGrid: true,
    fileOperationInProgress: false,
  }

  const [state, setState] = useState(initialState)
  const fileOpenRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    editor.events.addListener('zoom', ({ zoom }) =>
      setState((prevState) => {
        return { ...prevState, zoom }
      }),
    )

    editor.events.addListener('cursorMove', ({ tilePos }) =>
      setState((prevState) => {
        return { ...prevState, tilePos }
      }),
    )

    editor.events.addListener('brushChanged', ({ brush }) =>
      setState((prevState) => {
        return { ...prevState, brush }
      }),
    )

    let savingTimeout: number | null = null
    editor.events.addListener('changed', () => {
      if (savingTimeout === null) {
        savingTimeout = window.setTimeout(() => {
          savingTimeout = null
          saveMap(editor.map)
          console.log('saved state')
        }, 1000)
      }
    })
  }, [])

  const startSave = () => {
    setState((prevState) => {
      return { ...prevState, fileOperationInProgress: true }
    })

    try {
      saveAs(
        new Blob([JSON.stringify(editor.map)], {
          type: 'text/plain;charset=utf-8',
        }),
        'map.json',
        { autoBom: false },
      )
    } catch (err) {
      console.log(`save error: ${err}`)
    } finally {
      setState((prevState) => {
        return { ...prevState, fileOperationInProgress: false }
      })
    }
  }

  const startOpen = () => {
    const fnode = fileOpenRef.current
    if (fnode === null) {
      return
    }

    const files = fnode.files
    if (files === null || files.length === 0) {
      return
    }
    const f = files[0]

    setState((prevState) => {
      return { ...prevState, fileOperationInProgress: true }
    })

    const fr = new FileReader()
    fr.onloadend = () => {
      setState((prevState) => {
        return { ...prevState, fileOperationInProgress: false }
      })
    }
    fr.onerror = () => {
      console.log(`could not load ${f.name}: ${fr.error}`)
    }
    fr.onload = () => {
      try {
        const raw = JSON.parse(fr.result as string)
        saveMap(Map.fromRaw(raw))
        location.reload()
      } catch (err) {
        console.log(`error parsing ${f.name}: ${err}`)
      }
    }
    fr.readAsText(f)
  }

  const resetMapData = () => {
    reset()
    const blank = new Map(vec2.fromValues(64, 64))
    editor.map = blank
    editor.terrain = new terrain.Layer({
      tileOrigin: blank.origin,
      tileDimensions: blank.dimensions,
      tileSize: TILE_SIZE,
      terrain: blank.terrain,
    })
  }

  return (
    <div>
      <h4>Controls</h4>
      <ul>
        <li>Zoom: {state.zoom.toFixed(2)}</li>
        <li>
          Map: {state.map.dimensions[0]}x{state.map.dimensions[1]}
        </li>
        <li>
          Cursor position:{' '}
          {state.tilePos !== undefined
            ? `(${state.tilePos![0]}, ${state.tilePos![1]})`
            : ''}
        </li>
        <li>
          Brush: {BrushMode[state.brush.mode]} (
          {state.brush.mode === BrushMode.TERRAIN
            ? terrain.Type[state.brush.terrain]
            : entities.types.Type[state.brush.entity]}
          )
        </li>
        <li>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={state.showTerrain}
              onChange={(e) => {
                const show = e.target.checked // don't inline; this is a synthetic event
                setState((prevState) => {
                  editor.showTerrain = show
                  return { ...prevState, showTerrain: show }
                })
              }}
            />{' '}
            Terrain
          </label>
        </li>
        <li>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={state.showEntities}
              onChange={(e) => {
                const show = e.target.checked // don't inline; this is a synthetic event
                setState((prevState) => {
                  editor.showEntities = show
                  return { ...prevState, showEntities: show }
                })
              }}
            />{' '}
            Entities
          </label>
        </li>
        <li>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={state.showGrid}
              onChange={(e) => {
                const show = e.target.checked // don't inline; this is a synthetic event
                setState((prevState) => {
                  editor.showGrid = show
                  return { ...prevState, showGrid: show }
                })
              }}
            />{' '}
            Grid
          </label>
        </li>
        <li>
          Open:{' '}
          <input type="file" ref={fileOpenRef} onChange={startOpen}></input>
        </li>
        <li>
          <button disabled={state.fileOperationInProgress} onClick={startSave}>
            Save
          </button>
        </li>
        <li>
          <button onClick={resetMapData}>Reset</button>
        </li>
      </ul>
    </div>
  )
}
