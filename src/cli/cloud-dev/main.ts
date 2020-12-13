/**
 * Launches a development host in EC2. The program will terminate the instance
 * when closed.
 *
 * AVOID calling this from a package.json script, i.e. "yarn cloud-dev". If this
 * script is executed via a yarn/npm parent, CTRL+C will cause the parent to
 * surrender the TTY back to the shell before this script has finished its
 * shutdown cleanup.
 */

import * as fs from 'fs'
import * as os from 'os'

import * as AWS from 'aws-sdk'

import * as util from '../util'

/**
 * Launches a new instance based on the provided launch template, identified by
 * name.
 */
async function launch(
  ec2: AWS.EC2,
  templateName: string,
): Promise<AWS.EC2.Instance> {
  const res = await ec2
    .runInstances({
      MinCount: 1,
      MaxCount: 1,
      LaunchTemplate: { LaunchTemplateName: templateName },
    })
    .promise()

  if (!res.Instances || res.Instances.length == 0) {
    throw new Error('no instances returned')
  }

  return res.Instances[0]
}

/**
 * It takes a little while for PublicDnsName to become available for newly-
 * launched EC2 instances. This function will poll with backoff until the
 * hostname is available, or until reaching the max number of attempts.
 */
async function waitForPublicDnsName(
  ec2: AWS.EC2,
  instanceId: string,
): Promise<string> {
  const maxAttempts = 5
  let wait = 1500
  for (let i = 0; i < maxAttempts; i++) {
    const res = await ec2
      .describeInstances({ InstanceIds: [instanceId] })
      .promise()

    const reservations = res.Reservations
    if (!reservations || reservations.length == 0) {
      throw new Error(`could not find instance ${instanceId}`)
    }

    const instances = reservations[0].Instances
    if (!instances || instances.length == 0) {
      throw new Error(`could not find instance ${instanceId}`)
    }

    const instance = instances[0]
    if (
      instance.PublicDnsName !== undefined &&
      instance.PublicDnsName.length > 0
    ) {
      return instance.PublicDnsName
    }

    await util.sleep(wait)
    wait *= 2
  }

  throw new Error(
    `unable to read public hostname of ${instanceId} after ${maxAttempts} attempts`,
  )
}

async function terminate(ec2: AWS.EC2, instanceId: string): Promise<void> {
  await ec2.terminateInstances({ InstanceIds: [instanceId] }).promise()
}

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
}): string {
  return `Host ${opts.localHostAlias}
  HostName ${opts.remoteHost}
  User ${opts.remoteUser}
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
async function updateSshConfig(opts: {
  sshConfigPath: string
  localHostAlias: string
  remoteHost: string
  remoteUser: string
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

async function main(): Promise<void> {
  const ec2 = new AWS.EC2({ region: 'us-west-1' })
  const launchTemplateName = 'jeffanddom-cloud-dev-template-1'
  const localHostAlias = 'jeffanddom-cloud-dev'
  const remoteUser = 'ubuntu'
  const sshConfigPath = process.env['HOME'] + '/.ssh/config'

  console.log(`launching new instance of template ${launchTemplateName}...`)
  const instance = await launch(ec2, launchTemplateName)
  const instanceId = instance.InstanceId
  if (instanceId === undefined) {
    throw new Error('no instance ID returned')
  }

  // Ensure that the instance is terminated when this program quits.
  const quit = () => {
    console.log(`terminating ${instanceId}...`)

    // We not really supposed to use async functions as event handler callbacks,
    // so let's handle the termination results as promises.
    terminate(ec2, instanceId)
      .then(() => process.exit())
      .catch((e) => {
        console.error(e)
        process.exit(1)
      })
  }
  process.on('SIGINT', quit) // CTRL+C from TTY
  process.on('SIGTERM', quit) // `kill <this pid>`
  process.on('SIGHUP', quit) // Window/tab close

  // Fetch and print the public hostname.
  console.log(
    `instance ${instance.InstanceId} created, waiting for public hostname...`,
  )
  const remoteHost = await waitForPublicDnsName(ec2, instanceId)
  console.log(`public hostname is ${remoteHost}`)

  // Update SSH config with new remote host
  console.log(`updating ${sshConfigPath}...`)
  await updateSshConfig({
    sshConfigPath,
    localHostAlias,
    remoteHost,
    remoteUser,
  })

  // Prevent the program from quitting when main() returns. We'll wait for an
  // OS signal instead.
  console.log('Happy hacking! Press CTRL+C to terminate.')
  util.preventDefaultTermination()
}

main().catch((e) => {
  throw e
})
