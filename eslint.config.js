import { factory } from '@zzxming/eslint-config';

export default factory({
  overrides: [
    {
      ignores: ['demo/*.js*', 'dist/**'],
    },
    {
      rules: {
        'no-cond-assign': ['error', 'except-parens'],
      },
    },
  ],
});
