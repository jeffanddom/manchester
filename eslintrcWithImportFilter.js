/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')

/**
 * Use this to generate eslintrc config objects that ban local imports starting
 * with the ~/ prefix, except paths contained in the specified allow list.
 *
 * The eslintrc object extends the package level .eslintrc.js, but adds
 * no-restricted-imports rules for any directory contained in `<package
 * root>/src`, excluding directory names provided in the allow list.
 *
 * `startPath` will automatically be added to the allow list, so a new eslintrc
 * generated this way will not prevent internal imports within its own
 * directory.
 *
 * Example: suppose src/ contains the following child directories:
 *
 * - engine/
 * - game/
 * - util/
 *
 * If you call `eslintrcWithImportFilter(__dirname, ['util'])` from `engine/`,
 * the resulting eslintrc will ban imports to `~/game`, but will allow imports
 * to `~/engine` and `~/util`.
 *
 * Note that this only bans import statements using the ~/ prefix convention.
 * You can use relative import paths to circumvent these bans. This appears to
 * be a fundamental limitation of the no-restricted-imports eslint rule.
 */
function eslintrcWithImportFilter(startPath, allowList) {
  const eslintrc = {}

  // find the root .eslintrc.js file, if it exists.
  const packageRoot = getPackageRoot(startPath)
  const rootRcPath = path.join(packageRoot, '.eslintrc.js')
  if (fs.existsSync(rootRcPath)) {
    eslintrc['extends'] = [rootRcPath]
  }

  // find child directories of <package root>/src that are not in the allowlist.
  const srcPath = path.join(packageRoot, 'src')
  const restrictedDirs = getChildDirs(srcPath).filter((name) => {
    if (allowList.indexOf(name) >= 0) {
      return false
    }

    // Allow the subdirectory to import from itself
    if (path.join(srcPath, name) === startPath) {
      return false
    }

    return true
  })

  eslintrc['rules'] = {
    'no-restricted-imports': [
      'error',
      { patterns: restrictedDirs.map((name) => '~/' + name) },
    ],
  }

  return eslintrc
}

module.exports = eslintrcWithImportFilter

function getPackageRoot(startPath) {
  let dir = startPath
  while (dir.length > 1) {
    if (fs.readdirSync(dir).indexOf('package.json') >= 0) {
      return dir
    }
    dir = path.dirname(dir)
  }
  throw new Error(`project root not found when searching from ${startPath}`)
}

function getChildDirs(path) {
  return fs
    .readdirSync(path, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
}
