module.exports = {
  extends: ['../../.eslintrc.js'],
  // TODO: game/, apps/, and tools/ should depend on engine/, but not vice-versa.
  rules: {
    'no-restricted-imports': [
      'error',
      { patterns: ['~/game/*', '~/apps/*', '~/tools/*'] },
    ],
  },
}
