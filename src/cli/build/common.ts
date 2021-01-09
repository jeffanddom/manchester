import * as fs from 'fs'
import * as path from 'path'

const findProjectRoot = (): string => {
  let dir = __dirname
  while (dir.length > 1) {
    if (fs.readdirSync(dir).indexOf('package.json') >= 0) {
      return dir
    }
    dir = path.dirname(dir)
  }
  throw new Error(`project root not found when searching from ${__dirname}`)
}

export const projectRootPath = findProjectRoot()
export const gameSrcPath = path.join(projectRootPath, 'src')
export const buildOutputPath = path.join(projectRootPath, 'out')
export const webOutputPath = path.join(buildOutputPath, 'web')
export const serverOutputPath = path.join(buildOutputPath, 'server')
export const webEphemeralPath = path.join(gameSrcPath, 'web', 'ephemeral')
export const serverBuildVersionPath = path.join(
  serverOutputPath,
  'buildVersion',
)

export const webEntrypoints = ['client', 'tools/rendertoy']
