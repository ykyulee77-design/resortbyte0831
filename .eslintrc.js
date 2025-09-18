module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'react-hooks'],
  rules: {
    // TypeScript 관련 규칙
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-redeclare': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    
    // React 관련 규칙
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-unescaped-entities': 'warn',
    
    // 일반 규칙
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'off', // TypeScript 규칙으로 대체
    'prefer-const': 'warn',
    'no-var': 'warn',
    'no-restricted-globals': 'off', // confirm 사용 허용
    'no-empty': 'warn', // 빈 블록 경고로 변경
    'no-prototype-builtins': 'warn', // prototype 메서드 경고로 변경
    'no-useless-catch': 'warn', // 불필요한 try/catch 경고로 변경
    
    // 코드 스타일 (경고로 변경)
    'indent': ['warn', 2],
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'always'],
    'comma-dangle': ['warn', 'always-multiline'],
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'node_modules/',
    'build/',
    'dist/',
    '*.config.js',
    '*.config.ts',
  ],
};
