declare global {
  interface Window {
    hotReloadInterval?: number
  }
}

// This function will execute outside of the main client bundle, which means
// you should avoid using dependencies not available globally in the browser,
// as well as async/await.
export const initHotReload = (buildkey: string): void => {
  if (window.hotReloadInterval) {
    return
  }

  window.hotReloadInterval = setInterval(() => {
    fetch('/buildkey')
      .then((response) => {
        if (response.status != 200) {
          throw new Error(
            'buildkey fetch: invalid status ' + response.status.toString(),
          )
        }
        return response.text()
      })
      .then((newBuildkey) => {
        if (newBuildkey.length > 0 && newBuildkey !== buildkey) {
          console.log(
            'detected buildkey change from ' +
              buildkey.toString() +
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
  }, 2000)
}
