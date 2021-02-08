import React, { useState } from 'react'
import ReactDOM from 'react-dom'

import * as stackAllocator from '~/util/stackAllocator/__bench__'
import * as autoReload from '~/web/autoReload'

const benches: Record<string, () => unknown> = {
  stackAllocator: stackAllocator.bench,
}

function App() {
  const [selected, setSelected] = useState(Object.keys(benches)[0])
  const [results, setResults] = useState('')

  return (
    <div>
      <div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {Object.keys(benches).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            setResults(JSON.stringify(benches[selected](), null, '  '))
          }
        >
          run
        </button>
      </div>
      <div>
        <pre>
          <code>{results}</code>
        </pre>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('mount'))

autoReload.poll(1000)
