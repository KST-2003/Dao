// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const NO_HEX = { selector: 'Literal[value=/^#[0-9A-Fa-f]{6}$/]', message: 'Use theme colors (useTheme / media tokens), not hex literals.' };

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*', 'node_modules/*', 'coverage/*'] },


  // Architecture rule 2: coordinator hooks stay small (≤100 lines); split into focused hooks otherwise.
  {
    files: ['src/**/use*Screen.ts'],
    rules: { 'max-lines': ['error', { max: 100, skipBlankLines: true, skipComments: true }] },
  },

  // Architecture rule 3: no hardcoded colors outside the theme. Use theme tokens / media tokens.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/shared/theme/**'],
    rules: { 'no-restricted-syntax': ['error', NO_HEX] },
  },

  // Architecture rule 1: screens only render. State/effects live in the use*Screen coordinator hook.
  // (Declared after rule 3 so both selectors apply to screen files.)
  {
    files: ['src/**/*Screen.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        NO_HEX,
        {
          selector: "CallExpression[callee.name=/^(useState|useEffect|useReducer|useLayoutEffect|useRef)$/]",
          message: 'Screens render only — move state/effects into the use*Screen coordinator hook.',
        },
      ],
    },
  },

  {
    files: ['scripts/**/*.js'],
    languageOptions: { globals: { __dirname: 'readonly', require: 'readonly', process: 'readonly', console: 'readonly' } },
  },
]);
