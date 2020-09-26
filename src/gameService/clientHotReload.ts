declare global {
  interface Window {
    hotReload: {
      poll: (initialBuildkey: string) => void
      interval?: number
    }
  }
}

export const init = (): void => {
  window.hotReload = { poll }
}

// This function will execute outside of the main client bundle, which means
// you should avoid using dependencies not available globally in the browser,
// as well as async/await.
export const poll = (initialBuildkey: string): void => {
  if (window.hotReload.interval) {
    return
  }

  window.hotReload.interval = setInterval(() => {
    fetch('/client/buildkey')
      .then((response) => {
        if (response.status != 200) {
          throw new Error(
            'buildkey fetch: invalid status ' + response.status.toString(),
          )
        }

        return response.text()
      })
      .then((newBuildkey) => {
        if (newBuildkey.length > 0 && newBuildkey !== initialBuildkey) {
          console.log(
            'detected buildkey change from ' +
              initialBuildkey.toString() +
              ' to ' +
              newBuildkey.toString() +
              ', reloading...',
          )
          window.location.reload()
        }
      })
      .catch((err) => {
        console.log('buildkey fetch: error:', err)
      })
  }, 1000)
}
