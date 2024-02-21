import gulp from 'gulp';
import postcss from 'gulp-postcss';
import less from 'gulp-less';
import cleanCSS from 'gulp-clean-css';
import consola from 'consola';
import rename from 'gulp-rename';
import { resolve } from 'path';
import { rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import svg from 'rollup-plugin-svg-import';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const { src, watch, dest, series, parallel } = gulp;

const distBundle = resolve('./dist');
const demoRoot = resolve('./demo');
const moduleRoot = resolve('./src');
const themeInput = resolve(moduleRoot, 'assets/style/index.less');
const moduleInput = resolve(moduleRoot, 'index.js');
const demoInput = resolve(moduleRoot, 'demo.js');

const buildTheme = () => {
    return src(themeInput)
        .pipe(less())
        .pipe(postcss())
        .pipe(
            cleanCSS({}, (details) => {
                consola.success(
                    `${details.name}: ${details.stats.originalSize / 1000} KB -> ${
                        details.stats.minifiedSize / 1000
                    } KB`
                );
            })
        )
        .pipe(
            rename((p) => {
                p.dirname = '';
            })
        )
        .pipe(dest(distBundle));
};
const buildModule = async () => {
    const bundle = await rollup({
        input: moduleInput,
        external: [/^quill/],
        treeshake: true,
        plugins: [
            commonjs(),
            svg({
                stringify: true,
            }),
            getBabelOutputPlugin({
                presets: ['@babel/preset-env'],
            }),
            terser(),
        ],
    });
    return bundle.write({
        file: resolve(distBundle, 'index.js'),
        format: 'es',
        sourcemap: false,
    });
};
const buildDemo = series(buildModule, async () => {
    const bundle = await rollup({
        input: demoInput,
        treeshake: true,
        plugins: [
            commonjs(),
            svg({
                stringify: true,
            }),
        ],
        output: {
            globals: {
                quill: 'Quill',
            },
        },
    });
    return bundle.write({
        file: resolve(demoRoot, 'demo.js'),
        format: 'iife',
        sourcemap: true,
    });
});
const build = parallel(buildTheme, buildDemo);

export const theme = buildTheme;
export const module = buildModule;
export const dev = () => {
    watch('./src/**/*.js', build);
};
export default build;
