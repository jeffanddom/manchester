import * as path from 'path'

export const gameSrcPath = path.normalize(path.join(__dirname, '..', 'src'))
export const clientBuildPath = path.join(__dirname, 'clientBuild')
export const buildkeyPath = path.join(clientBuildPath, '.buildkey')
export const clientEntrypointPath = path.join(clientBuildPath, 'index.html')
