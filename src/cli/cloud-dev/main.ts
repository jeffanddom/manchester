/**
 * Launches a development host in EC2. The program will terminate the instance
 * when closed.
 *
 * AVOID calling this from a package.json script, i.e. "yarn cloud-dev". If this
 * script is executed via a yarn/npm parent, CTRL+C will cause the parent to
 * surrender the TTY back to the shell before this script has finished its
 * shutdown cleanup.
 */

import * as AWS from 'aws-sdk'

import * as util from '../util'

import * as awsUtils from './awsUtils'
import * as sshUtils from './sshUtils'

async function main(): Promise<void> {
  const ec2 = new AWS.EC2({ region: 'us-west-1' })
  const az = 'us-west-1a'
  const launchTemplateName = 'jeffanddom-cloud-dev-template-1'
  const localHostAlias = 'jeffanddom-cloud-dev'
  const remoteUser = 'ubuntu'
  const sshConfigPath = process.env['HOME'] + '/.ssh/config'
  const localPort = 3000
  const remotePort = 3000

  // Get IAM username
  console.log(`fetching IAM username...`)
  const username = (await awsUtils.getUser()).UserName
  console.log(`user: ${username}`)

  // Get user-associated EBS volume
  // TODO: ensure the volume is not currently in use (maybe detach before termination)
  console.log(`locating EBS volume...`)
  const volumeTags = new Map()
  volumeTags.set('app', 'jeffanddom-cloud-dev')
  volumeTags.set('user', username)
  const volume = await awsUtils.getEbsVolume(ec2, volumeTags)
  const volumeId = volume.VolumeId
  if (volumeId === undefined) {
    throw new Error(`invalid volume ID`)
  }
  console.log(`volume: ${volumeId}`)

  // Launch new EC2 instance
  console.log(
    `launching new instance of template ${launchTemplateName} for user ${username}...`,
  )
  const instance = await awsUtils.launch(ec2, {
    templateName: launchTemplateName,
    userTag: username,
    az,
  })
  const instanceId = instance.InstanceId
  if (instanceId === undefined) {
    throw new Error('no instance ID returned')
  }
  console.log(`instance: ${instanceId}`)

  // Ensure that the instance is terminated when this program quits.
  const quit = () => {
    console.log(`terminating ${instanceId}...`)

    // We not really supposed to use async functions as event handler callbacks,
    // so let's handle the termination results as promises.
    awsUtils
      .terminate(ec2, instanceId)
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
  console.log(`waiting for public hostname...`)
  const remoteHost = await awsUtils.waitForPublicDnsName(ec2, instanceId)

  // Attach volume ot instnace
  console.log(`attaching EBS volume...`)
  await awsUtils.attachVolume(ec2, instanceId, volumeId)

  // Update SSH config with new remote host
  console.log(`updating ${sshConfigPath}...`)
  await sshUtils.updateConfig({
    sshConfigPath,
    localHostAlias,
    remoteHost,
    remoteUser,
    localPort,
    remotePort,
  })

  // wait for sshd to accept connections
  console.log('waiting for SSH availability...')
  await sshUtils.waitForAvailability(localHostAlias)

  // Mount the volume to the filesystem
  console.log(`mounting volume...`)
  await sshUtils.exec(
    localHostAlias,
    'sudo mkdir /home/ubuntu/data && sudo mount /dev/nvme1n1 /home/ubuntu/data && sudo chown ubuntu:ubuntu /home/ubuntu/data',
  )

  // Prevent the program from quitting when main() returns. We'll wait for an
  // OS signal instead.
  console.log(`---
cloud-dev is ready!
* Remote hostname: ${remoteHost}
* SSH alias: ${localHostAlias}
  * Connect via: ssh ${localHostAlias}
  * Local port ${localPort} will be fowarded to remote port ${remotePort}
* Press CTRL+C to stop instance
---`)
  util.preventDefaultTermination()
}

main().catch((e) => {
  throw e
})
