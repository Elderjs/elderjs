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
import { getElderConfig, partialHydration } from '../index';
import { getDefaultRollup } from './validations';
import handleCss from './rollupPluginHandleCss';
import getPluginLocations from './getPluginLocations';
import ssrOutputPath from './ssrOutputPath';

const production = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;
const elderJsDir = path.resolve(process.cwd(), './node_modules/@elderjs/elderjs/');

const babelIE11 = babel({
  cwd: elderJsDir,
  extensions: ['.js', '.mjs', '.html', '.svelte'],
  runtimeHelpers: true,
  exclude: ['node_modules/@babel/**', 'node_modules/core-js/**'],
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
  plugins: [
    // [
    //   '@babel/plugin-transform-runtime',
    //   {
    //     corejs: {
    //       version: 3,
    //       proposals: true,
    //     },
    //     regenerator: true,
    //     useESModules: false,
    //     absoluteRuntime: path.resolve(process.cwd(), './node_modules/@elderjs/elderjs/node_modules/'),
    //   },
    // ],
  ],
});

export function createBrowserConfig({
  input,
  output,
  multiInputConfig,
  svelteConfig,
  replacements = {},
  ie11 = false as boolean,
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
      svelte({
        ...svelteConfig,
        dev: !production,
        immutable: true,
        hydratable: true,
        css: false,
      }),
      nodeResolve({
        browser: true,
        dedupe: ['svelte'],
        preferBuiltins: true,
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

export function createSSRConfig({ input, output, svelteConfig, replacements = {}, multiInputConfig, rootDir }) {
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
      svelte({
        ...svelteConfig,
        dev: !production,
        hydratable: true,
        generate: 'ssr',
        css: true,
        emitCss: true,
        extensions: '.svelte',
        preprocess: [...svelteConfig.preprocess, partialHydration],
      }),

      nodeResolve({
        browser: false,
        dedupe: ['svelte'],
      }),
      commonjs({ sourceMap: true }),
      // css({
      //   ignore: true,
      // }),
      handleCss({ rootDir }),
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
  const { ssrComponents, clientComponents } = $$internal;
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

  if (!production && dev && dev.splitComponents) {
    // watch/dev build bundles each component individually for faster reload times during dev.
    // we don't need iifes on dev.
    console.log(
      `NOTE: Splitting components into separate rollup objects, this breaks some svelte features such as stores.`,
    );

    [...components, ...pluginFiles].forEach((cv) => {
      const file = cv.replace(`${rootDir}/`, '');

      configs.push(
        createBrowserConfig({
          input: file,
          output: [
            {
              dir: clientComponents,
              entryFileNames: 'entry[name]-[hash].mjs',
              sourcemap: !production,
              format: 'esm',
            },
          ],
          svelteConfig,
          replacements,
          multiInputConfig: false,
        }),
      );
    });

    configs.push(
      // SSR /routes/ Svelte files.
      createSSRConfig({
        input: [
          `${relSrcDir}/layouts/*.svelte`,
          `${relSrcDir}/routes/*/*.svelte`,
          `${relSrcDir}/components/**/*.svelte`,
          ...pluginGlobs,
        ],
        output: {
          dir: ssrComponents,
          format: 'cjs',
          exports: 'auto',
        },
        multiInputConfig: multiInput({
          transformOutputPath: (output) => ssrOutputPath(output),
        }),
        svelteConfig,
        replacements,
        rootDir,
      }),
    );
  } else {
    configs.push(
      createBrowserConfig({
        input: [`${relSrcDir}/components/**/*.svelte`],
        output: [
          {
            dir: clientComponents,
            entryFileNames: 'entry[name]-[hash].mjs',
            sourcemap: !production,
            format: 'esm',
          },
        ],
        multiInputConfig: multiInput({
          transformOutputPath: (output) => `${path.basename(output)}`,
        }),
        svelteConfig,
        replacements,
      }),
    );

    configs.push(
      createSSRConfig({
        input: [
          `${relSrcDir}/layouts/*.svelte`,
          `${relSrcDir}/routes/*/*.svelte`,
          `${relSrcDir}/components/**/*.svelte`,
          ...pluginGlobs,
        ],
        output: {
          dir: ssrComponents,
          format: 'cjs',
          exports: 'auto',
        },
        multiInputConfig: multiInput({
          transformOutputPath: (output) => ssrOutputPath(output),
        }),
        svelteConfig,
        replacements,
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
                dir: clientComponents,
                entryFileNames: 'iife[name]-[hash].js',
                sourcemap: !production,
                format: 'iife',
              },
            ],
            svelteConfig,
            replacements,
            multiInputConfig: false,
            ie11: true,
          }),
        );
      });
    }
  }

  return configs;
}
