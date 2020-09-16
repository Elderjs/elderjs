// require('dotenv').config();
import svelte from 'rollup-plugin-svelte';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import css from 'rollup-plugin-css-only';
import multiInput from 'rollup-plugin-multi-input';
import externalGlobals from 'rollup-plugin-external-globals';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';
import del from 'del';
import { getElderConfig, partialHydration } from '../Elder';

const production = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;

function createBrowserConfig({ input, output, multiInputConfig = false, svelteConfig }) {
  const config = {
    cache: true,
    treeshake: true,
    input,
    output,
    plugins: [
      replace({
        'process.env.componentType': 'browser',
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }),
      json(),
      svelte({
        ...svelteConfig,
        dev: !production,
        immutable: true,
        hydratable: true,
        css: false,
      }),
      externalGlobals({
        systemjs: 'System',
      }),
      nodeResolve({
        browser: true,
        dedupe: ['svelte'],
        preferBuiltins: true,
      }),
      commonjs(),
    ],
  };
  // bundle splitting.
  if (multiInputConfig) {
    config.plugins.unshift(multiInputConfig);
  }
  // if is production let's babelify everything and minify it.
  if (production) {
    config.plugins.push(
      babel({
        extensions: ['.js', '.mjs', '.cjs', '.html', '.svelte'],
        include: ['node_modules/**', 'src/**'],
        exclude: ['node_modules/@babel/**'],
        runtimeHelpers: true,
      }),
    );
    config.plugins.push(terser());
  }
  return config;
}

function createSSRConfig({ input, output, svelteConfig, multiInputConfig = false }) {
  const config = {
    cache: true,
    treeshake: true,
    input,
    output,
    plugins: [
      replace({
        'process.env.componentType': 'server',
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }),
      json(),
      svelte({
        ...svelteConfig,
        dev: !production,
        hydratable: true,
        generate: 'ssr',
        css: true,
        extensions: '.svelte',
        preprocess: [...svelteConfig.preprocess, partialHydration],
      }),

      nodeResolve({
        browser: false,
        dedupe: ['svelte'],
      }),
      commonjs({ sourceMap: false }),
      css({
        ignore: true,
      }),
      production && terser(),
    ],
  };
  // if we are bundle splitting include them.
  if (multiInputConfig) {
    config.plugins.unshift(multiInputConfig);
  }

  return config;
}

export default function getRollupConfig({ svelteConfig }) {
  const elderConfig = getElderConfig();
  const { $$internal, distDir, srcDir, rootDir } = elderConfig;
  const { ssrComponents, clientComponents } = $$internal;

  const relSrcDir = srcDir.replace(rootDir, '').substr(1);

  console.log(`Elder.js using rollup in ${production ? 'production' : 'development'} mode.`);

  let configs = [];

  // clear out components so there are no conflicts due to hashing.
  del.sync([`${ssrComponents}*`, `${clientComponents}*`]);

  // Add ElderJs Peer deps to public if they exist.
  [
    ['./node_modules/intersection-observer/intersection-observer.js', './static/intersection-observer.js'],
    ['./node_modules/systemjs/dist/s.min.js', './static/s.min.js'],
  ]
    .filter((dep) => fs.existsSync(path.resolve(rootDir, dep[0])))
    .forEach((dep) => {
      configs.push({
        input: dep[0],
        output: [
          {
            file: path.resolve(distDir, dep[1]),
            format: 'iife',
            name: dep[1],
            plugins: [terser()],
          },
        ],
      });
    });

  // SSR /routes/ Svelte files.
  const templates = glob.sync(`${relSrcDir}/routes/*/*.svelte`).reduce((out, cv) => {
    const file = cv.replace(`${rootDir}/`, '');
    out.push(
      createSSRConfig({
        input: file,
        output: {
          dir: ssrComponents,
          format: 'cjs',
          exports: 'auto',
        },
        svelteConfig,
      }),
    );
    return out;
  }, []);

  // SSR /layouts/ Svelte files.
  const layouts = glob.sync(`${relSrcDir}/layouts/*.svelte`).reduce((out, cv) => {
    const file = cv.replace(`${rootDir}/`, '');
    out.push(
      createSSRConfig({
        input: file,
        output: {
          dir: ssrComponents,
          format: 'cjs',
          exports: 'auto',
        },
        svelteConfig,
      }),
    );

    return out;
  }, []);

  if (production) {
    // production build does bundle splitting, minification, and babel
    configs = [...configs, ...templates, ...layouts];
    if (fs.existsSync(path.resolve(srcDir, `./components/`))) {
      console.log(`${relSrcDir}/components/*/*.svelte`);
      configs.push(
        createBrowserConfig({
          input: [`${relSrcDir}/components/*/*.svelte`],
          output: {
            dir: clientComponents,
            entryFileNames: 'entry[name]-[hash].js',
            sourcemap: !production,
            format: 'system',
          },
          multiInputConfig: multiInput({
            relative: `${relSrcDir}/components`,
            transformOutputPath: (output) => `${path.basename(output)}`,
          }),
          svelteConfig,
        }),
      );
      configs.push(
        createSSRConfig({
          input: [`${relSrcDir}/components/*/*.svelte`],
          output: {
            dir: ssrComponents,
            format: 'cjs',
            exports: 'auto',
          },
          multiInputConfig: multiInput({
            relative: `${relSrcDir}/components`,
            transformOutputPath: (output) => `${path.basename(output)}`,
          }),
          svelteConfig,
        }),
      );
    }
  } else {
    // watch/dev build bundles each component individually for faster reload times during dev.
    let sharedComponents = [];
    if (fs.existsSync(path.resolve(srcDir, `./components/`))) {
      sharedComponents = glob.sync(path.resolve(srcDir, './components/*/*.svelte')).reduce((out, cv) => {
        const file = cv.replace(`${rootDir}/`, '');
        out.push(
          createBrowserConfig({
            input: file,
            output: {
              dir: clientComponents,
              entryFileNames: 'entry[name].js',
              sourcemap: !production,
              format: 'system',
            },
            svelteConfig,
          }),
        );
        out.push(
          createSSRConfig({
            input: file,
            output: {
              dir: ssrComponents,
              format: 'cjs',
              exports: 'auto',
            },
            svelteConfig,
          }),
        );

        return out;
      }, []);
    }
    configs = [...configs, ...templates, ...layouts, ...sharedComponents];
  }

  return configs;
}
