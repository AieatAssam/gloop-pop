import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.sim/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({ ...config, files: ['src/**/*.ts'] })),
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message: 'Use PALETTE for colours.',
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message: 'Use PALETTE for colours.',
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.ts', 'src/meta/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['../render/*', '../../render/*', '../ui/*', '../../ui/*', '../audio/*', '../../audio/*', '../platform/*', '../../platform/*', '../app/*', '../../app/*', '../input/*', '../../input/*'], message: 'Keep core and meta independent of presentation and platform code.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Core logic must be platform independent.' },
        { name: 'document', message: 'Core logic must be platform independent.' },
        { name: 'localStorage', message: 'Use the platform storage adapter.' },
        { name: 'Date', message: 'Pass time into pure logic.' },
        { name: 'performance', message: 'Core logic must not depend on wall time.' },
        { name: 'setTimeout', message: 'Core logic must not use timers.' },
        { name: 'setInterval', message: 'Core logic must not use timers.' },
        { name: 'requestAnimationFrame', message: 'Core logic must not use animation frames.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded core RNG.' },
      ],
    },
  },
  {
    files: ['src/render/palette.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['src/**/*.test.ts'],
    rules: { '@typescript-eslint/no-unsafe-assignment': 'off' },
  },
);
