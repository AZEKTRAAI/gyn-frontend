// eslint-config-next ships a ready-made flat config array (parser + plugins bundled)
import nextConfig from 'eslint-config-next'

// Extract @typescript-eslint plugin from the config next bundles so we can reference
// it in our own config object (plugins are scoped to the object they are defined in).
const tsPlugin = nextConfig.find((c) => c.plugins?.['@typescript-eslint'])?.plugins?.['@typescript-eslint'];

const config = [
  ...nextConfig,
  {
    plugins: tsPlugin ? { '@typescript-eslint': tsPlugin } : {},
    rules: {
      'no-unused-vars': 'off',              // @typescript-eslint/no-unused-vars covers this
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    // concepts are throwaway HTML prototypes, not part of the app
    ignores: ['concepts/**', 'node_modules/**', '.next/**'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,  // pre-existing eslint-disable comments in features/payments
    },
  },
];

export default config;
