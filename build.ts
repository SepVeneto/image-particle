import * as rollup from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'
import commonjs from '@rollup/plugin-commonjs'

async function build() {
  const plugins = [
    nodeResolve(),
    commonjs(),
    esbuild(),
  ]

  const rollupConfig: rollup.RollupOptions = {
    input: './src/index.ts',
    plugins,
    external: 'pixi.js'
  }

  const bundle = await rollup.rollup(rollupConfig)
  await bundle.write({
    format: 'es',
    file: './dist/index.es.js'
  })
  await bundle.write({
    format: 'cjs',
    file: './dist/index.cjs.js',
    exports: 'named'
  })
  await bundle.write({
    format: 'umd',
    file: './dist/index.umd.js',
    name: 'LOGO_PARTICLE',
    exports: 'named',
    globals: (name) => {
      switch(name) {
        case 'pixi.js':
          return 'PIXI'
        default:
          return name
      }
    },
  })
  console.log('success')
}

;(() => {
  build()
})()
