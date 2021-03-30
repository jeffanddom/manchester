import React from 'react'
import { Handles, Slider, Tracks } from 'react-compound-slider'

export const Handle = ({ handle: { id, value, percent }, getHandleProps }) => {
  return (
    <div
      style={{
        left: `${percent}%`,
        position: 'absolute',
        marginLeft: -10,
        marginTop: 0,
        zIndex: 2,
        width: 20,
        height: 20,
        border: 0,
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: '50%',
        backgroundColor: '#2C4870',
        color: '#333',
      }}
      {...getHandleProps(id)}
    >
      <div
        style={{
          fontFamily: 'Roboto',
          fontSize: 11,
          marginTop: 0,
          color: 'white',
        }}
      >
        {value}
      </div>
    </div>
  )
}

const Track = ({ source, target, getTrackProps }) => {
  return (
    <div
      style={{
        position: 'absolute',
        height: 10,
        zIndex: 1,
        marginTop: 5,
        backgroundColor: '#546C91',
        borderRadius: 5,
        cursor: 'pointer',
        left: `${source.percent}%`,
        width: `${target.percent - source.percent}%`,
      }}
      {...getTrackProps()}
    />
  )
}

export const MultiSlider: React.FC<{
  values: number[]
  range: number[]
  onChange: (values: number[]) => void
}> = ({ values, range, onChange }) => {
  return (
    <Slider
      rootStyle={{
        position: 'relative',
        width: '100%',
        height: 25,
      }}
      domain={range}
      step={1}
      values={values}
      onChange={(changed) => {
        onChange(changed.slice().sort())
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: 10,
          marginTop: 5,
          borderRadius: 5,
          backgroundColor: 'white',
        }}
      />
      <Handles>
        {({ handles, getHandleProps }) => (
          <div className="slider-handles">
            {handles.map((handle) => (
              <Handle
                key={handle.id}
                handle={handle}
                getHandleProps={getHandleProps}
              />
            ))}
          </div>
        )}
      </Handles>
      <Tracks left={false} right={false}>
        {({ tracks, getTrackProps }) => (
          <div className="slider-tracks">
            {tracks.map(({ id, source, target }) => (
              <Track
                key={id}
                source={source}
                target={target}
                getTrackProps={getTrackProps}
              />
            ))}
          </div>
        )}
      </Tracks>
    </Slider>
  )
}
