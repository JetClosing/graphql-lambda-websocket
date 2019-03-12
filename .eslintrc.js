module.exports = {
  extends: 'airbnb-base',
  plugins: [
    'jest',
    'flowtype',
  ],
  env: {
    jest: true,
  },
  rules: {
    'arrow-parens': ['error', 'always'],

    // Jest
    'jest/no-disabled-tests': 'error',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'warn',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'warn',

    // Flow
    'flowtype/require-valid-file-annotation': [
      'error',
      'always'
    ],
    'flowtype/no-flow-fix-me-comments': 'error',
    'flowtype/no-weak-types': [
      'warn', 
      {
        any: true,
        Object: true,
        Function: false
      }
    ],
    'flowtype/semi': [
      'error',
      'always'
    ],
  },
  overrides: [
    {
      files: [
        '*\\.test\\.js', 
        '*\\.config\\.js', 
        '*\\.setup\\.js',
        '**/__tests__/**', 
        '**/__mocks__/**', 
        'scripts/**',
        'examples/**',
      ],
      rules: {
        'flowtype/require-valid-file-annotation': 'off'
      }
    }
  ]
};
