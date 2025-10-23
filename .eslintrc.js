module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'prettier'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@next/next/no-img-element': 'off'
  }
};
