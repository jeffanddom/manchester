module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.eslint.json',
  },
  settings: {
    react: { version: 'detect' },
  },
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  plugins: ['import'],
  rules: {
    '@typescript-eslint/strict-boolean-expressions': [
      2,
      { allowNullableBoolean: true },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'prettier/prettier': [
      1,
      {
        tabWidth: 2,
        useTabs: false,
        singleQuote: true,
        semi: false,
        trailingComma: 'all',
      },
    ],
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
  },
}
