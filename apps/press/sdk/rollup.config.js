import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/sendpress.umd.js',
      format: 'umd',
      name: 'SendPress',
      sourcemap: true
    },
    {
      file: 'dist/sendpress.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/sendpress.min.js',
      format: 'iife',
      name: 'SendPress',
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    production && terser()
  ]
};
