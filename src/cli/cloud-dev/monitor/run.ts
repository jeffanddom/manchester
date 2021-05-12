import * as AWS from 'aws-sdk'

import { getConfig } from '../config'
import * as slack from '../slack'

function twoPad(n: number): string {
  if (n < 10) {
    return '0' + n.toString()
  }
  return n.toString()
}

function secondsToHourString(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor(seconds / 60) % 60
  const s = Math.round(seconds % 60)
  return twoPad(h) + ':' + twoPad(m) + ':' + twoPad(s)
}

function ageSeconds(date: Date): number {
  return (Date.now() - date.getTime()) / 1000
}

function formatLongLivedInstance(
  instance: AWS.EC2.Instance,
  awsRegion: string,
): string {
  const instanceId = instance.InstanceId ?? '_no instance id_'
  const tags = instance.Tags ?? []
  const label =
    tags.filter((t) => t.Key === 'user').map((t) => t.Value)[0] ?? instanceId

  const age =
    instance.LaunchTime !== undefined
      ? secondsToHourString(ageSeconds(instance.LaunchTime))
      : 'unknown'
  const url = `https://${awsRegion}.console.aws.amazon.com/ec2/v2/home#InstanceDetails:instanceId=${instanceId}`
  return `• <${url}|${label}>, age ${age} `
}

/**
 * Returns EC2 instances matching the provided tags.
 */
async function getInstancesByTag(
  ec2: AWS.EC2,
  tags: Map<string, string>,
): Promise<AWS.EC2.Instance[]> {
  const filters: AWS.EC2.FilterList = []
  for (const [k, v] of tags) {
    filters.push({
      Name: `tag:${k}`,
      Values: [v],
    })
  }

  const res = await ec2.describeInstances({ Filters: filters }).promise()
  if (res.Reservations === undefined) {
    return []
  }

  return res.Reservations.flatMap((r) => {
    if (r.Instances === undefined) {
      return []
    }
    return r.Instances
  })
}

export async function run(): Promise<void> {
  const config = getConfig()
  console.info(
    `checking for instances older than ${config.instanceAgeAlertThreshold} seconds`,
  )

  const slackApiToken = config.slackApiToken
  if (slackApiToken === undefined) {
    throw `slackApiToken not defined`
  }

  const slackChannel = config.slackChannel
  if (slackChannel === undefined) {
    throw `slackChannel not defined`
  }

  const ec2 = new AWS.EC2({ region: config.awsRegion })
  const instances = await getInstancesByTag(
    ec2,
    new Map([['app', config.instanceAppTag]]),
  )
  const oldInstances = instances.filter((i) => {
    if (i.State?.Name === 'terminated') {
      return false
    }

    if (i.LaunchTime === undefined) {
      return false
    }

    return ageSeconds(i.LaunchTime) >= config.instanceAgeAlertThreshold
  })

  if (oldInstances.length === 0) {
    console.info('no long-lived instances found')
    return
  }

  console.info(`${oldInstances.length} long-lived instances detected`)

  const message = `:red_circle: *Long-lived instances detected*

${oldInstances
  .map((i) => formatLongLivedInstance(i, config.awsRegion))
  .join('\n')}    
`

  await slack.postMessage({
    message,
    channel: slackChannel,
    token: slackApiToken,
  })
}
