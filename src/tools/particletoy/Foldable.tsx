import React, { useState } from 'react'

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    cursor: 'pointer',
    marginTop: 5,
  },
  label: {
    userSelect: 'none',
    fontWeight: 'bold',
    paddingBottom: 5,
  },
}

export function Foldable(
  props: React.PropsWithChildren<{
    title: string
    initialOpen?: boolean
  }>,
): React.ReactElement {
  const [open, setOpen] = useState(props.initialOpen ?? false)
  return (
    <div style={styles.container}>
      <div style={styles.label} onClick={() => setOpen(!open)}>
        {open ? '-' : '+'} {props.title}
      </div>
      {open ? <div>{props.children}</div> : null}
    </div>
  )
}
