declare global {
  interface Window {
    autoReload: {
      enabled: boolean
      poll: (initialBuildVersion: string) => void
      interval?: number
    }
  }
}

export const init = (opts: { enabled: boolean } = { enabled: true }): void => {
  window.autoReload = { enabled: opts.enabled, poll }
}

// This function will execute outside of the main client bundle, which means
// you should avoid using dependencies not available globally in the browser,
// as well as async/await.
export const poll = (initialBuildVersion: string): void => {
  if (window.autoReload.interval !== undefined) {
    return
  }

  window.autoReload.interval = window.setInterval(() => {
    fetch('/api/buildVersion')
      .then((response) => {
        if (response.status != 200) {
          throw new Error(
            'build version fetch: invalid status ' + response.status.toString(),
          )
        }

        return response.text()
      })
      .then((newBuildVersion) => {
        if (
          newBuildVersion.length > 0 &&
          newBuildVersion !== initialBuildVersion
        ) {
          console.log(
            'detected build version change from ' +
              initialBuildVersion.toString() +
              ' to ' +
              newBuildVersion.toString() +
              ', reloading...',
          )
          window.location.reload()
        }
      })
      .catch((err) => {
        console.log('build version fetch: error:', err)
      })
  }, 3000)
}

export const updateEntrypointHtmlForAutoReload = (opts: {
  buildVersion: string
  html: string
}): string => {
  return opts.html.replace(
    '<!-- DEV SERVER AUTORELOAD PLACEHOLDER -->',
    `
<script>
  window.buildVersion = '${opts.buildVersion}'
  console.log('build version: ' + window.buildVersion)

  if (window.autoReload.enabled) {
    window.autoReload.poll(window.buildVersion)
  }
</script>
`,
  )
}
