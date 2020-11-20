import svelte from 'rollup-plugin-svelte';
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
import del from 'del';
import defaultsDeep from 'lodash.defaultsdeep';
import { getElderConfig } from '../index';
import { getDefaultRollup } from '../utils/validations';
import getPluginLocations from '../utils/getPluginLocations';
import elderSvelte from './rollupPlugin';

const production = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;
const elderJsDir = path.resolve(process.cwd(), './node_modules/@elderjs/elderjs/');

const babelIE11 = babel({
  extensions: ['.js', '.mjs', '.html', '.svelte'],
  runtimeHelpers: true,
  exclude: ['node_modules/@babel/**', 'node_modules/core-js/**', /\/core-js\//],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['> 0.25%', 'not dead', 'IE 11'],
        },
        useBuiltIns: 'usage',
        forceAllTransforms: true,
        corejs: {
          version: 3.6,
          proposals: true,
        },
      },
    ],
  ],
});

export function createBrowserConfig({
  input,
  output,
  multiInputConfig,
  svelteConfig,
  replacements = {},
  ie11 = false as boolean,
  distElder,
  distDir,
  rootDir,
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
      elderSvelte({ svelteConfig, type: 'client', distElder, distDir, rootDir, legacy: ie11 }),
      nodeResolve({
        browser: true,
        dedupe: ['svelte', 'core-js'],
        preferBuiltins: true,
        rootDir: ie11 ? elderJsDir : process.cwd(),
      }),
      commonjs({ sourceMap: !production }),
    ],
  };

  // bundle splitting.
  if (multiInputConfig) {
    config.plugins.unshift(multiInputConfig);
  }

  // ie11 babel
  if (ie11) {
    config.plugins.push(babelIE11);
  }

  // if is production let's babelify everything and minify it.
  if (production) {
    // don't babel if it has been done
    if (!ie11) {
      config.plugins.push(
        babel({
          extensions: ['.js', '.mjs', '.cjs', '.html', '.svelte'],
          include: ['node_modules/**', 'src/**'],
          exclude: ['node_modules/@babel/**'],
          runtimeHelpers: true,
        }),
      );
    }

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
  rootDir,
  distElder,
  distDir,
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
      elderSvelte({ svelteConfig, type: 'ssr', distElder, distDir, rootDir }),
      nodeResolve({
        browser: false,
        dedupe: ['svelte'],
      }),
      commonjs({ sourceMap: true }),
      production && terser(),
    ],
  };
  // if we are bundle splitting include them.
  if (multiInputConfig) {
    config.plugins.unshift(multiInputConfig);
  }

  return config;
}

export default function getRollupConfig(options) {
  const defaultOptions = getDefaultRollup();
  const { svelteConfig, replacements, dev } = defaultsDeep(options, defaultOptions);
  const elderConfig = getElderConfig();
  const { $$internal, distDir, srcDir, rootDir, legacy } = elderConfig;
  const { ssrComponents, clientComponents, distElder } = $$internal;
  const relSrcDir = srcDir.replace(rootDir, '').substr(1);

  console.log(`Elder.js using rollup in ${production ? 'production' : 'development'} mode.`);

  const configs = [];

  // clear out components so there are no conflicts due to hashing.
  del.sync([`${ssrComponents}*`, `${clientComponents}*`]);
  // Add ElderJs Peer deps to public if they exist.
  [['./node_modules/intersection-observer/intersection-observer.js', './static/intersection-observer.js']].forEach(
    (dep) => {
      if (!fs.existsSync(path.resolve(rootDir, dep[0]))) {
        throw new Error(`Elder.js peer dependency not found at ${dep[0]}`);
      }
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
    },
  );

  const { paths: pluginPaths, files: pluginFiles } = getPluginLocations(elderConfig);
  const pluginGlobs = pluginPaths.map((plugin) => `${plugin}*.svelte`);

  const components = fs.existsSync(path.resolve(srcDir, `./components/`))
    ? [
        ...new Set([
          ...glob.sync(path.resolve(srcDir, './components/*/*.svelte')),
          ...glob.sync(path.resolve(srcDir, './components/*.svelte')),
        ]),
      ]
    : [];

  configs.push(
    createSSRConfig({
      input: [
        `${relSrcDir}/layouts/*.svelte`,
        `${relSrcDir}/routes/**/*.svelte`,
        `${relSrcDir}/components/**/*.svelte`,
        ...pluginGlobs,
      ],
      output: {
        dir: ssrComponents,
        format: 'cjs',
        exports: 'auto',
        sourcemap: !production ? 'inline' : false,
      },
      multiInputConfig: multiInput({
        relative: 'src/',
        // transformOutputPath: (output) => ssrOutputPath(output),
      }),
      svelteConfig,
      replacements,
      rootDir,
      distElder,
      distDir,
    }),
  );

  configs.push(
    createBrowserConfig({
      input: [`${relSrcDir}/components/**/*.svelte`],
      output: [
        {
          dir: clientComponents,
          sourcemap: !production ? 'inline' : false,
          format: 'esm',
          entryFileNames: '[name].[hash].js',
        },
      ],
      multiInputConfig: multiInput({
        relative: 'src/',
        // transformOutputPath: (output) => `${path.basename(output)}`,
      }),
      svelteConfig,
      replacements,
      distElder,
      distDir,
      rootDir,
    }),
  );

  // legacy is only done on production or not split modes.
  if (legacy && production) {
    [...components, ...pluginFiles].forEach((cv) => {
      const file = cv.replace(`${rootDir}/`, '');
      const parsed = path.parse(cv);
      configs.push(
        createBrowserConfig({
          input: file,
          output: [
            {
              name: `___elderjs_${parsed.name}`,
              entryFileNames: '[name].[hash].js',
              dir: `${clientComponents}${path.sep}iife${path.sep}`,
              sourcemap: !production,
              format: 'iife',
            },
          ],
          svelteConfig,
          replacements,
          multiInputConfig: false,
          ie11: true,
          distElder,
          distDir,
          rootDir,
        }),
      );
    });
  }

  return configs;
}
