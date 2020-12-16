import * as childProcess from 'child_process'
import * as fs from 'fs'
import * as os from 'os'

import * as util from '../util'

/**
 * Removes a host definition block from an SSH config. The block is chosen by
 * matching the localHost parameter against the "Host" declaration. If there is
 * a trailing newline after the block, it will be removed.
 */
function removeSshHostConfig(sshConfig: string, localHost: string): string {
  const lines = sshConfig.split(os.EOL)
  const res = []
  let skip = false

  for (let i = 0; i < lines.length; i++) {
    // Stop skipping if we reach a new Host or Match line
    if (skip && lines[i].match(/^s*(Host|Match)/)) {
      skip = false
    }

    // Start skipping if we see a Host line matching the localHost arg value
    if (lines[i].match(new RegExp(`^\\s*Host\\s+${localHost}`))) {
      skip = true
    }

    if (skip) {
      continue
    }

    res.push(lines[i])
  }

  return res.join(os.EOL)
}

function sshConfigTemplate(opts: {
  localHostAlias: string
  remoteHost: string
  remoteUser: string
  localPort: number
  remotePort: number
}): string {
  return `Host ${opts.localHostAlias}
  HostName ${opts.remoteHost}
  User ${opts.remoteUser}
  ForwardAgent yes
  LocalForward ${opts.remotePort} localhost:${opts.localPort}
`
}

/**
 * Updates the given SSH config file. A Host directive matching the
 * localHostAlias argument will be replaced with a new one using the provided
 * remoteHost value. If no such directive exists, one will be created.
 *
 * The old version of the SSH config file will be preserved in a backup file.
 * The backup file will have a `.cloud-dev-backup` suffix.
 */
export async function updateConfig(opts: {
  sshConfigPath: string
  localHostAlias: string
  remoteHost: string
  remoteUser: string
  localPort: number
  remotePort: number
}): Promise<void> {
  const srcConfig = (await fs.promises.readFile(opts.sshConfigPath)).toString()

  // write a backup
  const backupPath = opts.sshConfigPath + '.cloud-dev-backup'
  await fs.promises.writeFile(backupPath, srcConfig)

  let newConfig = removeSshHostConfig(srcConfig, opts.localHostAlias)

  // add a trailing gap if necessary
  if (!newConfig.endsWith(os.EOL + os.EOL)) {
    newConfig += os.EOL + os.EOL
  }

  // append the new SSH config
  newConfig += sshConfigTemplate(opts)
  await fs.promises.writeFile(opts.sshConfigPath, newConfig)
}

/**
 * TODO: this might be waiting the maximum amount of time, due to no input in
 * the "accept host key fingerprint" prompt
 */
export async function waitForAvailability(host: string): Promise<void> {
  const retries = 4
  let timeout = 1000
  for (let i = 0; i < retries; i++) {
    await util.sleep(timeout)
    timeout *= 2
    try {
      childProcess.execSync(`ssh ${host} echo noop`, {
        stdio: 'ignore',
      })
      break
    } catch (err) {
      /* do nothing */
    }
  }
}

export async function exec(host: string, cmd: string): Promise<void> {
  childProcess.execSync(`ssh ${host} ${JSON.stringify(cmd)}`, {
    stdio: 'inherit',
  })
}
