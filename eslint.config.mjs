// eslint-config-next ships a ready-made flat config array (parser + plugins bundled)
import nextConfig from 'eslint-config-next'

export default [
  ...nextConfig,
  {
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
]
