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
    if (skip && lines[i].match(/^s*(Host|Match)/) !== null) {
      skip = false
    }

    // Start skipping if we see a Host line matching the localHost arg value
    if (lines[i].match(new RegExp(`^\\s*Host\\s+${localHost}`)) !== null) {
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
  remoteHostname: string
  remoteUser: string
  localPort: number
  remotePort: number
}): string {
  return `Host ${opts.localHostAlias}
  HostName ${opts.remoteHostname}
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
  remoteHostname: string
  remoteUser: string
  localPort: number
  remotePort: number
}): Promise<void> {
  const srcConfig = (await fs.promises.readFile(opts.sshConfigPath)).toString()

  // write a backup
  // TODO: this backup scheme is not useful when calling cloud-dev repeatedly
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
 * WARNING: ONLY call this function for hosts where you can safely expect a
 * newly-generated SSH key, such as a recently-provisioned EC2 host.
 *
 * Adds the provided content to the user's ~/.ssh/known_hosts file.
 */
export async function extendKnownHosts(
  content: string,
  config: { knownHostsPath: string },
): Promise<void> {
  const src = (await fs.promises.readFile(config.knownHostsPath)).toString()

  // write a backup
  // TODO: this backup scheme is not useful when calling cloud-dev repeatedly
  const backupPath = config.knownHostsPath + '.cloud-dev-backup'
  await fs.promises.writeFile(backupPath, src)

  // replace original file
  if (!src.endsWith(os.EOL)) {
    content = os.EOL + content
  }
  if (!content.endsWith(os.EOL)) {
    content += os.EOL
  }
  await fs.promises.writeFile(config.knownHostsPath, src + content)
}

/**
 * Removes lines starting with any of the given prefixes from user's
 * ~/.ssh/known_hosts file.
 */
export async function removeFromKnownHosts(
  prefixes: string[],
  config: { knownHostsPath: string },
): Promise<void> {
  const src = (await fs.promises.readFile(config.knownHostsPath)).toString()
  const filtered = src
    .split(os.EOL)
    .filter((line) => prefixes.find((p) => line.startsWith(p)) === undefined)
    .join(os.EOL)

  if (src === filtered) {
    return
  }

  // write a backup
  // TODO: this backup scheme is not useful when calling cloud-dev repeatedly
  const backupPath = config.knownHostsPath + '.cloud-dev-backup'
  await fs.promises.writeFile(backupPath, src)

  // replace original file
  await fs.promises.writeFile(config.knownHostsPath, filtered)
}

/**
 * TODO: this might be waiting the maximum amount of time, due to no input in
 * the "accept host key fingerprint" prompt
 */
export async function waitForHostPubkeys(host: string): Promise<string> {
  const retries = 4
  let timeout = 1000
  let result: string | undefined

  for (let i = 0; i < retries; i++) {
    await util.sleep(timeout)
    timeout *= 2
    try {
      result = childProcess
        .execSync(`ssh-keyscan ${host}`, {
          stdio: [
            'ignore', // stdin
            'pipe', // stdout (will be captured in return value)
            'ignore', // stderr (ssh-keyscan emits unhelpful comment strings)
          ],
        })
        .toString()
      break
    } catch (err) {
      /* do nothing */
    }
  }

  if (result === undefined) {
    throw new Error(`could not fetch SSH identity from ${host}`)
  }

  return result
}

export async function exec(host: string, cmd: string): Promise<void> {
  childProcess.execSync(`ssh ${host} ${JSON.stringify(cmd)}`, {
    stdio: 'inherit',
  })
}
