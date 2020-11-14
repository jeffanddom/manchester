import * as React from 'react'
import styled from 'styled-components'

import { maps } from '~/assets/maps'
import { getCurrentMap, setCurrentMap } from '~/storage'

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  cursor: default;

  border-radius: 10px;
  background-color: rgba(200, 200, 200, 0.25);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  color: white;
  margin: 10px;
  padding: 10px 14px;
`

export const Controls = (): React.ReactElement => {
  const options = Object.keys(maps).map((key) => ({
    value: key,
    label: `${key}.json`,
  }))
  return (
    <Container>
      Map:
      <select
        onChange={(evt) => {
          setCurrentMap(evt.target.value)
          window.location = window.location
        }}
        value={getCurrentMap() ?? 'bigMap'}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Container>
  )
}
