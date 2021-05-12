import * as fs from 'fs'
import * as path from 'path'

export interface Config {
  slackApiToken?: string
  slackChannel?: string
  instanceAppTag: string
  awsRegion: string
  awsAZ: string
  instanceAgeAlertThreshold: number // expressed in seconds
}

export function getConfig(): Config {
  const defaultConfig = {
    slackApiToken: process.env['SLACK_API_TOKEN'],
    slackChannel: process.env['SLACK_CHANNEL'],
    instanceAppTag: 'cloud-dev',
    awsRegion: 'us-west-1',
    awsAZ: 'us-west-1a',
    instanceAgeAlertThreshold: 3 * 60 * 60,
  }

  const configPath = path.join(process.env['HOME'] ?? '', '.cloud-dev')
  if (!fs.existsSync(configPath)) {
    return defaultConfig
  }

  const contents = JSON.parse(fs.readFileSync(configPath).toString())

  return Object.assign(defaultConfig, {
    slackApiToken: contents['slackApiToken'],
    slackChannel: contents['slackChannel'],
  })
}
