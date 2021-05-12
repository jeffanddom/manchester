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

import * as AWS from 'aws-sdk'

import * as util from '../../util'
import * as awsUtils from '../awsUtils'
import { Config, getConfig } from '../config'
import * as slack from '../slack'
import * as sshUtils from '../sshUtils'

class CloudDev {
  ec2: AWS.EC2

  az: string
  launchTemplateName: string
  localHostAlias: string
  remoteUser: string
  sshConfigPath: string
  sshKnownHostsPath: string
  localPort: number
  remotePort: number

  awsUsername?: string
  ebsVolumeId?: string
  instanceId?: string
  remoteHost:
    | {
        name: string
        ip: string
      }
    | undefined

  config: Config

  constructor(config: Config) {
    this.ec2 = new AWS.EC2({ region: config.awsRegion })
    this.az = config.awsAZ
    this.launchTemplateName = 'jeffanddom-cloud-dev-template-1'
    this.localHostAlias = 'jeffanddom-cloud-dev'
    this.remoteUser = 'ubuntu'
    this.sshConfigPath = process.env['HOME'] + '/.ssh/config'
    this.sshKnownHostsPath = process.env['HOME'] + '/.ssh/known_hosts'
    this.localPort = 3000
    this.remotePort = 3000
    this.config = config
  }

  async run(): Promise<void> {
    // Get IAM username
    console.info(`fetching IAM username...`)
    this.awsUsername = (await awsUtils.getUser()).UserName
    console.info(`user: ${this.awsUsername}`)

    // Get user-associated EBS volume
    // TODO: ensure the volume is not currently in use (maybe detach before termination)
    console.info(`locating EBS volume...`)
    const volumeTags = new Map()
    volumeTags.set('app', 'jeffanddom-cloud-dev')
    volumeTags.set('user', this.awsUsername)
    const volume = await awsUtils.getEbsVolumeByTag(this.ec2, volumeTags)
    this.ebsVolumeId = volume.VolumeId
    if (this.ebsVolumeId === undefined) {
      throw new Error(`invalid volume ID`)
    }
    console.info(`volume: ${this.ebsVolumeId}`)

    console.info(`Finding or creating instance...`)
    const [instance, volumeAttached] = await awsUtils.getInstanceForVolume(
      this.ec2,
      volume,
      {
        instance: {
          templateName: this.launchTemplateName,
          userTag: this.awsUsername,
          appTag: this.config.instanceAppTag,
          az: this.az,
        },
      },
    )

    if (instance.InstanceId === undefined) {
      throw `InstsanceID is undefined`
    }
    this.instanceId = instance.InstanceId

    if (volumeAttached) {
      console.info(`instance ${this.instanceId} already attached, reusing...`)
    } else {
      console.info(
        `launched new instance ${this.instanceId} with template ${this.launchTemplateName} for user ${this.awsUsername}...`,
      )
    }

    let quitting = false
    const onQuit = () => {
      if (quitting) {
        return
      }
      quitting = true

      this.cleanup()
        .then(() => {
          process.exit()
        })
        .catch((err) => {
          console.info(err)
          process.exit(1)
        })
    }
    process.on('SIGINT', onQuit) // CTRL+C from TTY
    process.on('SIGTERM', onQuit) // `kill <this pid>`
    process.on('SIGHUP', onQuit) // Window/tab close

    // Fetch and print the public hostname.
    console.info(`waiting for public hostname...`)
    this.remoteHost = await awsUtils.waitForPublicDnsName(
      this.ec2,
      this.instanceId,
    )
    console.info(`hostname: ${this.remoteHost.name}`)

    // Attach volume to instance
    if (!volumeAttached) {
      console.info(`attaching EBS volume...`)
      await awsUtils.attachVolume(this.ec2, this.instanceId, this.ebsVolumeId)
    }

    // wait for sshd to accept connections
    console.info('waiting for SSH availability...')
    const hostPubkeys = await sshUtils.waitForHostPubkeys(this.remoteHost.name)

    console.info(`extending ${this.sshKnownHostsPath} with host pubkeys...`)
    await sshUtils.extendKnownHosts(hostPubkeys, {
      knownHostsPath: this.sshKnownHostsPath,
    })

    // Update SSH config with new remote host
    console.info(`updating ${this.sshConfigPath}...`)
    await sshUtils.updateConfig({
      sshConfigPath: this.sshConfigPath,
      localHostAlias: this.localHostAlias,
      remoteHostname: this.remoteHost.name,
      remoteUser: this.remoteUser,
      localPort: this.localPort,
      remotePort: this.remotePort,
    })

    // Mount the volume to the filesystem
    const remoteUserdir = '/home/' + this.remoteUser
    const mountpoint = remoteUserdir + '/data'
    console.info(`mounting volume...`)
    sshUtils.exec(
      this.localHostAlias,
      `(mount | grep -q "${mountpoint}") || \
      ( \
        sudo mkdir -p ${mountpoint} && \
        sudo mount /dev/nvme1n1 ${mountpoint} && \
        sudo chown ${this.remoteUser}:${this.remoteUser} ${mountpoint} \
      )`,
    )

    // Copy gitconfig
    const gitconfigPath = process.env['HOME'] + '/.gitconfig'
    if (fs.existsSync(gitconfigPath)) {
      console.info(`uploading gitconfig...`)
      sshUtils.upload({
        remoteUser: this.remoteUser,
        remoteHost: this.remoteHost.name,
        localPath: gitconfigPath,
        remotePath: remoteUserdir + '/.gitconfig',
      })
    }

    // Prevent the program from quitting when main() returns. We'll wait for an
    // OS signal instead.
    util.preventDefaultTermination()

    // Print some diagnostics
    console.info(`---
cloud-dev is ready!
* Remote hostname: ${this.remoteHost.name}
* SSH alias: ${this.localHostAlias}
  * Connect via: ssh ${this.localHostAlias}
  * Local port ${this.localPort} will be fowarded to remote port ${this.remotePort}
* Press CTRL+C to stop instance
---`)

    // Attempt to post to Slack
    if (
      this.config['slackApiToken'] !== undefined &&
      this.config['slackChannel'] !== undefined
    ) {
      try {
        await slack.postMessage({
          message: `${this.awsUsername}'s dev server available at http://${this.remoteHost.name}:${this.remotePort}`,
          token: this.config['slackApiToken'],
          channel: this.config['slackChannel'],
        })
      } catch (err) {
        console.error(`Error posting Slack notification: ${err}`)
      }
    }
  }

  async cleanup(): Promise<void> {
    // ensure visual space after "^C" termination character
    console.info('')

    if (this.instanceId !== undefined) {
      console.info(`terminating ${this.instanceId}...`)
      await awsUtils.terminate(this.ec2, this.instanceId)
    }

    if (this.remoteHost !== undefined) {
      console.info(
        `removing ${this.remoteHost.name} from ${this.sshKnownHostsPath}...`,
      )
      await sshUtils.removeFromKnownHosts(
        [this.remoteHost.name, this.remoteHost.ip],
        {
          knownHostsPath: this.sshKnownHostsPath,
        },
      )
    }
  }
}

const cd = new CloudDev(getConfig())
cd.run().catch((e) => {
  console.error(e)
  process.exit(1)
})
