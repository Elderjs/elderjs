// reload the build process when svelte files are added clearing the cache.

// server that reloads the app which watches the file system for changes.
// reload can also be called after esbuild finishes the rebuild.
// the file watcher should restart the entire esbuild process when a new svelte file is seen. This includes clearing caches.

import { build, BuildResult } from 'esbuild';
import glob from 'glob';
import path from 'path';

import fs from 'fs-extra';

import { PreprocessorGroup } from 'svelte/types/compiler/preprocess/types';
import esbuildPluginSvelte from './esbuildPluginSvelte.js';
import { InitializationOptions, SettingsOptions } from '../utils/types.js';
import getConfig from '../utils/getConfig.js';
import { devServer } from '../rollup/rollupPlugin.js';
import getPluginLocations from '../utils/getPluginLocations.js';

const production = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'PRODUCTION';
export type TPreprocess = PreprocessorGroup | PreprocessorGroup[] | false;
export type TSvelteHandler = {
  config: SettingsOptions;
  preprocess: TPreprocess;
};

export async function getSvelteConfig(elderConfig: SettingsOptions): Promise<TPreprocess> {
  const svelteConfigPath = path.resolve(elderConfig.rootDir, `./svelte.config.js`);
  if (fs.existsSync(svelteConfigPath)) {
    try {
      const req = await import(svelteConfigPath);
      if (req) {
        return req;
      }
    } catch (err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        console.warn(`Unable to load svelte.config.js from ${svelteConfigPath}`, err);
      }
      return false;
    }
  }
  return false;
}

export async function getPackagesWithSvelte(pkg, elderConfig: SettingsOptions) {
  const pkgs = []
    .concat(pkg.dependents ? Object.keys(pkg.dependents) : [])
    .concat(pkg.devDependencies ? Object.keys(pkg.devDependencies) : []);

  const sveltePackages = [];
  for (const pkg of pkgs) {
    try {
      const resolved = path.resolve(elderConfig.rootDir, `./node_modules/${pkg}/package.json`);
      const current = fs.readJSONSync(resolved);
      if (current.svelte) {
        sveltePackages.push(pkg);
      }
    } catch (e) {
      //
    }
  }

  return sveltePackages;
}

const getRestartHelper = (startOrRestartServer) => {
  let state;
  const defaultState = { ssr: false, client: false };
  const resetState = () => {
    state = JSON.parse(JSON.stringify(defaultState));
  };

  resetState();

  // eslint-disable-next-line consistent-return
  return (type: 'start' | 'reset' | 'client' | 'ssr') => {
    if (type === 'start') {
      return startOrRestartServer();
    }
    if (type === 'reset') {
      return resetState();
    }

    state[type] = true;
    if (state.ssr && state.client) {
      startOrRestartServer();
      resetState();
    }
  };
};

// eslint-disable-next-line consistent-return
const svelteHandler = async ({ elderConfig, svelteConfig, replacements, restartHelper }) => {
  try {
    const builders: { ssr?: BuildResult; client?: BuildResult } = {};

    // eslint-disable-next-line global-require
    const pkg = fs.readJsonSync(path.resolve(elderConfig.rootDir, './package.json'));
    const globPath = path.resolve(elderConfig.rootDir, `./src/**/*.svelte`);
    const initialEntryPoints = glob.sync(globPath);
    const sveltePackages = await getPackagesWithSvelte(pkg, elderConfig);
    const elderPlugins = getPluginLocations(elderConfig);

    builders.ssr = await build({
      entryPoints: [...initialEntryPoints, ...elderPlugins.files],
      bundle: true,
      outdir: elderConfig.$$internal.ssrComponents,
      plugins: [
        esbuildPluginSvelte({
          type: 'ssr',
          sveltePackages,
          elderConfig,
          svelteConfig,
        }),
      ],
      watch: {
        onRebuild(error) {
          restartHelper('ssr');
          if (error) console.error('ssr watch build failed:', error);
        },
      },
      format: 'esm',
      target: ['es2020'],
      platform: 'node',
      sourcemap: !production,
      minify: production,
      outbase: 'src',
      external: pkg.dependents ? [...Object.keys(pkg.dependents)] : [],
      define: {
        'process.env.componentType': "'server'",
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        ...replacements,
      },
    });

    builders.client = await build({
      entryPoints: [...initialEntryPoints.filter((i) => i.includes('src/components')), ...elderPlugins.files],
      bundle: true,
      outdir: elderConfig.$$internal.clientComponents,
      entryNames: '[dir]/[name].[hash]',
      plugins: [
        esbuildPluginSvelte({
          type: 'client',
          sveltePackages,
          elderConfig,
          svelteConfig,
        }),
      ],
      watch: {
        onRebuild(error) {
          if (error) console.error('client watch build failed:', error);
          restartHelper('client');
        },
      },
      format: 'esm',
      target: ['es2020'],
      platform: 'browser',
      sourcemap: !production,
      minify: true,
      splitting: true,
      chunkNames: 'chunks/[name].[hash]',
      logLevel: 'error',
      outbase: 'src',
      define: {
        'process.env.componentType': "'browser'",
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        ...replacements,
      },
    });

    restartHelper('start');

    const restart = async () => {
      if (builders.ssr) await builders.ssr.stop();
      if (builders.client) await builders.client.stop();
      restartHelper('reset');
      return svelteHandler({
        elderConfig,
        svelteConfig,
        replacements,
        restartHelper,
      });
    };

    return restart;
  } catch (e) {
    console.error(e);
  }
};

type TEsbuildBundler = {
  initializationOptions?: InitializationOptions;
  replacements?: { [key: string]: string | boolean };
};

const esbuildBundler = async ({ initializationOptions = {}, replacements = {} }: TEsbuildBundler = {}) => {
  try {
    const elderConfig = await getConfig(initializationOptions);
    const svelteConfig = await getSvelteConfig(elderConfig);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { startOrRestartServer, startWatcher, childProcess } = devServer({
      forceStart: true,
      elderConfig,
    });

    const restartHelper = getRestartHelper(startOrRestartServer);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const restartEsbuild = await svelteHandler({
      elderConfig,
      svelteConfig,
      replacements,
      restartHelper,
    });

    startWatcher();
  } catch (e) {
    console.log(e);
  }
};
export default esbuildBundler;
