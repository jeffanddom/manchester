import React, { useState } from 'react'

export function Foldable(
  props: React.PropsWithChildren<{
    title: string
    initialOpen?: boolean
  }>,
): React.ReactElement {
  const [open, setOpen] = useState(props.initialOpen ?? false)
  return (
    <div>
      <span onClick={() => setOpen(!open)}>
        {open ? '-' : '+'} {props.title}
      </span>
      {open ? <div>{props.children}</div> : null}
    </div>
  )
}
