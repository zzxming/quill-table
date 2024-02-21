import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import gulp from 'gulp';
import less from 'gulp-less';
import postcss from 'gulp-postcss';
import pxtorem from 'postcss-pxtorem';
import autoprefixer from 'autoprefixer';
import cleanCSS from 'gulp-clean-css';
import consola from 'consola';
import rename from 'gulp-rename';
import { rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import svg from 'rollup-plugin-svg-import';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const { src, watch, dest, series, parallel } = gulp;

const __dirname = dirname(fileURLToPath(import.meta.url));
const distBundle = resolve(__dirname, './dist');
const demoRoot = resolve(__dirname, './demo');
const moduleRoot = resolve(__dirname, './src');
const themeInput = resolve(moduleRoot, 'assets/style/index.less');
const moduleInput = resolve(moduleRoot, 'index.js');
const demoInput = resolve(moduleRoot, 'demo.js');

const buildTheme = () => {
    const postcssPlugins = [
        autoprefixer(),
        pxtorem({
            rootValue: 16,
            propList: ['*'],
            selectorBlackList: ['*-origin'],
        }),
    ];
    return src(themeInput)
        .pipe(less())
        .pipe(postcss(postcssPlugins))
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
const buildDemo = async () => {
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
};
const build = parallel(buildTheme, series(buildModule, buildDemo));

export const theme = buildTheme;
export const module = buildModule;
export const demo = buildDemo;
export const dev = () => {
    watch('./src/**/*.js', build);
};
export default build;
