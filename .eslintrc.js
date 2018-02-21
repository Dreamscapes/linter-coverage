'use strict'

module.exports = {
  parser: 'babel-eslint',
  globals: {
    atom: true,
  },

  settings: {
    'import/core-modules': [
      'atom',
    ],
  },

  extends: [
    '@strv/javascript/environments/nodejs/v8-3',
    '@strv/javascript/environments/nodejs/optional',
    '@strv/javascript/coding-styles/recommended',
  ],

  rules: {
    // If your editor cannot show these to you, occasionally turn this off and run the linter
    'no-warning-comments': 0,
  },

  overrides: [{
    files: ['spec/**/*.js'],
    env: {
      jasmine: true,
    },
  }]
}
