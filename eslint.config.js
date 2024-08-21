import { factory } from '@zzxming/eslint-config';

export default factory({
  overrides: [
    {
      ignores: ['demo/**', 'dist/**'],
    },
    {
      rules: {
        'no-cond-assign': ['error', 'except-parens'],
      },
    },
  ],
});
