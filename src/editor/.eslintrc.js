/* eslint-disable @typescript-eslint/no-var-requires */
const eslintrcWithImportFilter = require('../../eslintrcWithImportFilter')
module.exports = eslintrcWithImportFilter(__dirname, [
  'types',
  'util',
  'engine',
  'common',
])
