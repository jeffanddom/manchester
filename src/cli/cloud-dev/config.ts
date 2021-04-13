import * as fs from 'fs'
import * as path from 'path'

export interface Config {
  slackApiToken?: string
  slackChannel?: string
}

export function getConfig(): Config {
  const configPath = path.join(process.env['HOME'] ?? '', '.cloud-dev')
  if (!fs.existsSync(configPath)) {
    return {}
  }

  const contents = JSON.parse(fs.readFileSync(configPath).toString())
  const slackApiToken = contents['slackApiToken']
  const slackChannel = contents['slackChannel']

  return { slackApiToken, slackChannel }
}
