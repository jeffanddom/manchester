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
export const clientBuildPath = path.join(projectRootPath, 'clientBuild')
export const buildkeyPath = path.join(clientBuildPath, 'buildkey')