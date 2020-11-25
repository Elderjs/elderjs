import { cosmiconfigSync } from 'cosmiconfig';
import defaultsDeep from 'lodash.defaultsdeep';
import path from 'path';
import fs from 'fs-extra';
import { SettingsOptions, InitializationOptions } from './types';
import { getDefaultConfig } from './validations';
import prepareFindSvelteComponent from '../partialHydration/prepareFindSvelteComponent';

function getConfig(initializationOptions: InitializationOptions = {}): SettingsOptions {
  let loadedConfig: InitializationOptions = {};
  const explorerSync = cosmiconfigSync('elder');
  const explorerSearch = explorerSync.search();
  if (explorerSearch && explorerSearch.config) {
    loadedConfig = explorerSearch.config;
  }
  const config: SettingsOptions = defaultsDeep(initializationOptions, loadedConfig, getDefaultConfig());

  const rootDir = config.rootDir === 'process.cwd()' ? process.cwd() : path.resolve(config.rootDir);
  config.rootDir = rootDir;
  config.srcDir = path.resolve(rootDir, `./${config.srcDir}`);
  config.distDir = path.resolve(rootDir, `./${config.distDir}`);

  config.context = typeof initializationOptions.context !== 'undefined' ? initializationOptions.context : 'unknown';
  config.server = initializationOptions.context === 'server' && config.server;
  config.build = initializationOptions.context === 'build' && config.build;
  config.worker = !!initializationOptions.worker;

  const ssrComponents = path.resolve(config.rootDir, './___ELDER___/compiled/');
  const clientComponents = path.resolve(config.distDir, './_elderjs/svelte/');
  const distElder = path.resolve(config.distDir, './_elderjs/');
  fs.ensureDirSync(path.resolve(distElder));

  config.$$internal = {
    ssrComponents,
    clientComponents,
    distElder,
    prefix: `[Elder.js]:`,
    findComponent: prepareFindSvelteComponent({
      ssrFolder: ssrComponents,
      rootDir,
      clientComponents,
      distDir: config.distDir,
    }),
  };

  if (config.css === 'file') {
    const assetPath = path.resolve(distElder, `.${path.sep}assets`);
    fs.ensureDirSync(path.resolve(assetPath));
    const cssFiles = fs.readdirSync(assetPath).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 1) {
      throw new Error(
        `${config.$$internal.prefix} Race condition has caused multiple css files in ${assetPath}. If you keep seeing this delete the _elder and ___ELDER___  folders.`,
      );
    }
    // eslint-disable-next-line prefer-destructuring
    config.$$internal.publicCssFileName = cssFiles[0];
  }

  if (config.origin === '') {
    console.error(
      `WARN: Remember to put a valid "origin" in your elder.config.js. This should be a fully qualified domain. This is frequently used plugins and leaving it blank can cause SEO headaches.`,
    );
  }

  return config;
}

export default getConfig;
