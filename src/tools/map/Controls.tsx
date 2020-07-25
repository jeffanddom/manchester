import { saveAs } from 'file-saver'
import { vec2 } from 'gl-matrix'
import * as React from 'react'
import { ReactElement, useRef, useState } from 'react'

import { reset, saveMap } from './storage'

import * as entities from '~/entities'
import { Map } from '~/map/interfaces'
import * as terrain from '~/terrain'
import { BrushMode, Editor } from '~/tools/map/Editor'

export const Controls = ({ editor }: { editor: Editor }): ReactElement => {
  const [state, setState] = useState({
    zoom: 1,
    map: editor.map,
    tilePos: null,
    brush: editor.brush,
    showTerrain: true,
    showEntities: true,
    showGrid: true,
    fileOperationInProgress: false,
  })

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
        savingTimeout = setTimeout(() => {
          savingTimeout = null
          saveMap(editor.map)
          console.log('saved state')
        }, 1000)
      }
    })
  }, [])

  const toggleTerrain = () => {
    setState((prevState) => {
      editor.showTerrain = !state.showTerrain
      return { ...prevState, showTerrain: !state.showTerrain }
    })
  }

  const toggleEntities = () => {
    setState((prevState) => {
      editor.showEntities = !state.showEntities
      return { ...prevState, showEntities: !state.showEntities }
    })
  }

  const toggleGrid = () => {
    setState((prevState) => {
      editor.showGrid = !state.showGrid
      return { ...prevState, showGrid: !state.showGrid }
    })
  }

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
    if (!fnode) {
      return
    }

    const files = fnode.files
    if (!files || files.length === 0) {
      return
    }
    const f = files[0]

    setState((prevState) => {
      return { ...prevState, fileOperationInProgress: true }
    })

    f.text()
      .then((json) => {
        try {
          const raw = JSON.parse(json)
          saveMap(Map.fromRaw(raw))
          location.reload()
        } catch (err) {
          console.log(`could not parse ${f.name}: ${err}`)
        }
      })
      .finally(() => {
        setState((prevState) => {
          return { ...prevState, fileOperationInProgress: false }
        })
      })
  }

  const resetMapData = () => {
    reset()
    const blank = new Map(vec2.fromValues(64, 64))
    editor.map = blank
    editor.terrain = new terrain.Layer({
      tileOrigin: blank.origin,
      tileDimensions: blank.dimensions,
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
          {state.tilePos ? `(${state.tilePos![0]}, ${state.tilePos![1]})` : ''}
        </li>
        <li>
          Brush: {BrushMode[state.brush.mode]} (
          {state.brush.mode === BrushMode.TERRAIN
            ? terrain.Type[state.brush.terrain]
            : entities.types.Type[state.brush.entity]}
          )
        </li>
        <li>
          <span style={{ cursor: 'pointer' }} onClick={toggleTerrain}>
            <input type="checkbox" checked={state.showTerrain} /> Terrain
          </span>
        </li>
        <li>
          <span style={{ cursor: 'pointer' }} onClick={toggleEntities}>
            <input type="checkbox" checked={state.showEntities} /> Entities
          </span>
        </li>
        <li>
          <span style={{ cursor: 'pointer' }} onClick={toggleGrid}>
            <input type="checkbox" checked={state.showGrid} /> Grid
          </span>
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
