import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import multiInput from 'rollup-plugin-multi-input';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';
import defaultsDeep from 'lodash.defaultsdeep';
import { getElderConfig } from '../index';
import { getDefaultRollup } from '../utils/validations';
import getPluginLocations from '../utils/getPluginLocations';
import elderSvelte from './rollupPlugin';
import normalizePrefix from '../utils/normalizePrefix';

const production = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;

export function createBrowserConfig({
  input,
  output,
  multiInputConfig,
  svelteConfig,
  replacements = {},
  elderConfig,
  startDevServer = false,
}) {
  const toReplace = {
    'process.env.componentType': "'browser'",
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    ...replacements,
  };

  const config = {
    cache: true,
    treeshake: production,
    input,
    output,
    plugins: [
      replace(toReplace),
      json(),
      elderSvelte({ svelteConfig, type: 'client', elderConfig, startDevServer }),
      nodeResolve({
        browser: true,
        dedupe: ['svelte'],
        preferBuiltins: true,
        rootDir: process.cwd(),
      }),
      commonjs({ sourceMap: !production }),
    ],
    watch: {
      chokidar: {
        usePolling: process.platform !== 'darwin',
      },
    },
  };

  // bundle splitting.
  if (multiInputConfig) {
    config.plugins.unshift(multiInputConfig);
  }

  // ie11 babel

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

    // terser on prod
    config.plugins.push(terser());
  }

  return config;
}

export function createSSRConfig({
  input,
  output,
  svelteConfig,
  replacements = {},
  multiInputConfig,
  elderConfig,
  startDevServer = false,
}) {
  const toReplace = {
    'process.env.componentType': "'server'",
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    ...replacements,
  };

  const config = {
    cache: true,
    treeshake: production,
    input,
    output,
    plugins: [
      replace(toReplace),
      json(),
      elderSvelte({ svelteConfig, type: 'ssr', elderConfig, startDevServer }),
      nodeResolve({
        browser: false,
        dedupe: ['svelte'],
      }),
      commonjs({ sourceMap: true }),
      production && terser(),
    ],
    watch: {
      chokidar: {
        usePolling: !/^(win32|darwin)$/.test(process.platform),
      },
    },
  };
  // if we are bundle splitting include them.
  if (multiInputConfig) {
    config.plugins.unshift(multiInputConfig);
  }

  return config;
}

export default function getRollupConfig(options) {
  const defaultOptions = getDefaultRollup();
  const { svelteConfig, replacements, startDevServer } = defaultsDeep(options, defaultOptions);
  const elderConfig = getElderConfig();
  const relSrcDir = elderConfig.srcDir.replace(elderConfig.rootDir, '').substr(1);

  console.log(`Elder.js using rollup in ${production ? 'production' : 'development'} mode.`);

  const configs = [];

  const { paths: pluginPaths } = getPluginLocations(elderConfig);
  const pluginGlobs = pluginPaths.map((plugin) => `${plugin}*.svelte`);

  configs.push(
    createSSRConfig({
      input: [
        `${relSrcDir}/layouts/*.svelte`,
        `${relSrcDir}/routes/**/*.svelte`,
        `${relSrcDir}/components/**/*.svelte`,
        ...pluginGlobs,
      ],
      output: {
        dir: elderConfig.$$internal.ssrComponents,
        format: 'cjs',
        exports: 'auto',
        sourcemap: !production ? 'inline' : false,
      },
      multiInputConfig: multiInput({
        relative: 'src/',
      }),
      svelteConfig,
      replacements,
      elderConfig,
      startDevServer,
    }),
  );

  const clientComponents = [...glob.sync(`${relSrcDir}/components/**/*.svelte`), ...pluginGlobs];

  if (clientComponents.length > 0) {
    // keep things from crashing of there are no components
    configs.push(
      createBrowserConfig({
        input: [`${relSrcDir}/components/**/*.svelte`, ...pluginGlobs],
        output: [
          {
            dir: elderConfig.$$internal.clientComponents,
            sourcemap: !production ? 'inline' : false,
            format: 'esm',
            entryFileNames: '[name].[hash].js',
          },
        ],
        multiInputConfig: multiInput({
          relative: 'src/',
        }),
        svelteConfig,
        replacements,
        elderConfig,
        startDevServer,
      }),
    );
  }

  return configs;
}
