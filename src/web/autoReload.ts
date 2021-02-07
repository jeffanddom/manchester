// buildVersion.ts will be missing if you haven't built anything yet. To prevent
// CI compile errors, we'll use the following absurd series of lint exceptions.
//
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { buildVersion } from '~/web/ephemeral/buildVersion'

export function poll(period: number = 3 * 1000): void {
  console.log(`starting reload poll, build version is ${buildVersion}`)

  window.setInterval(() => {
    fetch('/api/buildVersion')
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(
            'build version fetch: invalid status ' + response.status.toString(),
          )
        }

        return response.text()
      })
      .then((newBuildVersion) => {
        if (newBuildVersion.length > 0 && newBuildVersion !== buildVersion) {
          console.log(
            `detected build version change from ${buildVersion} to ${newBuildVersion}, reloading...`,
          )
          window.location.reload()
        }
      })
      .catch((err) => {
        console.log('build version fetch: error:', err)
      })
  }, period)
}
