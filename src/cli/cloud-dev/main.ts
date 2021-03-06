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

import * as util from '../util'

import * as awsUtils from './awsUtils'
import * as sshUtils from './sshUtils'

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

  constructor() {
    this.ec2 = new AWS.EC2({ region: 'us-west-1' })
    this.az = 'us-west-1a'
    this.launchTemplateName = 'jeffanddom-cloud-dev-template-1'
    this.localHostAlias = 'jeffanddom-cloud-dev'
    this.remoteUser = 'ubuntu'
    this.sshConfigPath = process.env['HOME'] + '/.ssh/config'
    this.sshKnownHostsPath = process.env['HOME'] + '/.ssh/known_hosts'
    this.localPort = 3000
    this.remotePort = 3000
  }

  async run(): Promise<void> {
    // Get IAM username
    console.log(`fetching IAM username...`)
    this.awsUsername = (await awsUtils.getUser()).UserName
    console.log(`user: ${this.awsUsername}`)

    // Get user-associated EBS volume
    // TODO: ensure the volume is not currently in use (maybe detach before termination)
    console.log(`locating EBS volume...`)
    const volumeTags = new Map()
    volumeTags.set('app', 'jeffanddom-cloud-dev')
    volumeTags.set('user', this.awsUsername)
    const volume = await awsUtils.getEbsVolume(this.ec2, volumeTags)
    this.ebsVolumeId = volume.VolumeId
    if (this.ebsVolumeId === undefined) {
      throw new Error(`invalid volume ID`)
    }
    console.log(`volume: ${this.ebsVolumeId}`)

    // Launch new EC2 instance
    console.log(
      `launching new instance of template ${this.launchTemplateName} for user ${this.awsUsername}...`,
    )
    const instance = await awsUtils.launch(this.ec2, {
      templateName: this.launchTemplateName,
      userTag: this.awsUsername,
      az: this.az,
    })
    this.instanceId = instance.InstanceId
    if (this.instanceId === undefined) {
      throw new Error('no instance ID returned')
    }
    console.log(`instance: ${this.instanceId}`)

    const onQuit = () => {
      this.cleanup()
        .then(() => {
          process.exit()
        })
        .catch((err) => {
          console.log(err)
          process.exit(1)
        })
    }
    process.on('SIGINT', onQuit) // CTRL+C from TTY
    process.on('SIGTERM', onQuit) // `kill <this pid>`
    process.on('SIGHUP', onQuit) // Window/tab close

    // Fetch and print the public hostname.
    console.log(`waiting for public hostname...`)
    this.remoteHost = await awsUtils.waitForPublicDnsName(
      this.ec2,
      this.instanceId,
    )
    console.log(`hostname: ${this.remoteHost.name}`)

    // Attach volume to instance
    console.log(`attaching EBS volume...`)
    await awsUtils.attachVolume(this.ec2, this.instanceId, this.ebsVolumeId)

    // wait for sshd to accept connections
    console.log('waiting for SSH availability...')
    const hostPubkeys = await sshUtils.waitForHostPubkeys(this.remoteHost.name)

    console.log(`extending ${this.sshKnownHostsPath} with host pubkeys...`)
    await sshUtils.extendKnownHosts(hostPubkeys, {
      knownHostsPath: this.sshKnownHostsPath,
    })

    // Update SSH config with new remote host
    console.log(`updating ${this.sshConfigPath}...`)
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
    console.log(`mounting volume...`)
    sshUtils.exec(
      this.localHostAlias,
      `sudo mkdir -p ${mountpoint} && sudo mount /dev/nvme1n1 ${mountpoint} && sudo chown ${this.remoteUser}:${this.remoteUser} ${mountpoint}`,
    )

    // Copy gitconfig
    const gitconfigPath = process.env['HOME'] + '/.gitconfig'
    if (fs.existsSync(gitconfigPath)) {
      console.log(`uploading gitconfig...`)
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

    console.log(`---
cloud-dev is ready!
* Remote hostname: ${this.remoteHost.name}
* SSH alias: ${this.localHostAlias}
  * Connect via: ssh ${this.localHostAlias}
  * Local port ${this.localPort} will be fowarded to remote port ${this.remotePort}
* Press CTRL+C to stop instance
---`)
  }

  async cleanup(): Promise<void> {
    // ensure visual space after "^C" termination character
    console.log('')

    if (this.instanceId !== undefined) {
      console.log(`terminating ${this.instanceId}...`)
      await awsUtils.terminate(this.ec2, this.instanceId)
    }

    if (this.remoteHost !== undefined) {
      console.log(
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

const cd = new CloudDev()
cd.run().catch((e) => {
  console.log(e)
  process.exit(1)
})
