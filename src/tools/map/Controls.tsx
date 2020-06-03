import * as React from 'react'
import { useState } from 'react'
import { vec2 } from 'gl-matrix'
import { BrushMode, Editor } from './Editor'
import { Terrain } from '~map/interfaces'
import * as entities from '~entities'
import { Option } from '~util/Option'

export const Controls = ({ editor }: { editor: Editor }) => {
  const [state, setState] = useState({
    zoom: 1,
    map: editor.map,
    tilePos: Option.none<vec2>(),
    brush: editor.brush,
    showTerrain: true,
    showEntities: true,
    showGrid: true,
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
            ? Terrain[state.brush.terrain]
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
      </ul>
    </div>
  )
}
