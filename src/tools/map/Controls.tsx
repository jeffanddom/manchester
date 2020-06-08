import * as React from 'react'
import { useState } from 'react'
import { vec2 } from 'gl-matrix'
import { BrushMode, Editor } from './Editor'
import * as terrain from '~terrain'
import * as entities from '~entities'
import { None } from '~util/Option'

export const Controls = ({ editor }: { editor: Editor }) => {
  const [state, setState] = useState({
    zoom: 1,
    map: editor.map,
    tilePos: None<vec2>(),
    brush: editor.brush,
    showTerrain: true,
    showEntities: true,
    showGrid: true,
    exporting: false,
  })

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

    let savingTimeout: NodeJS.Timeout | null = null
    editor.events.addListener('changed', () => {
      if (savingTimeout === null) {
        savingTimeout = setTimeout(() => {
          savingTimeout = null
          window.localStorage.setItem(
            'tools/map',
            JSON.stringify({
              previous: editor.map,
            }),
          )
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

  const startExport = () => {
    setState((prevState) => {
      return { ...prevState, exporting: true }
    })

    const exported = JSON.stringify(editor.map)
    navigator.clipboard
      .writeText(exported)
      .then(() => {
        console.log('copied map data to clipboard')
      })
      .catch((error) => console.log(`Export error: ${error}`))
      .finally(() => {
        setState((prevState) => {
          return { ...prevState, exporting: false }
        })
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
          {state.tilePos.mapOr(
            '',
            (tilePos) => `(${tilePos[0]}, ${tilePos[1]})`,
          )}
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
          <button disabled={state.exporting} onClick={startExport}>
            Export
          </button>
        </li>
      </ul>
    </div>
  )
}
