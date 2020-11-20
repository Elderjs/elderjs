import { cosmiconfigSync } from 'cosmiconfig';
import defaultsDeep from 'lodash.defaultsdeep';
import path from 'path';
import fs from 'fs-extra';
import { SettingsOptions, InitializationOptions } from './types';
import { getDefaultConfig } from './validations';
import prepareFindSvelteComponent from '../partialHydration/prepareFindSvelteComponent';

function getConfig(initializationOptions: InitializationOptions = {}): SettingsOptions {
  const explorerSync = cosmiconfigSync('elder');
  const explorerSearch = explorerSync.search();
  let loadedConfig: InitializationOptions = {};
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
      clientFolder: clientComponents,
      distDir: config.distDir,
    }),
  };

  if (config.css === 'file') {
    config.$$internal.publicCssFileName = fs
      .readdirSync(path.resolve(distElder, `.${path.sep}assets`))
      .find((f) => f.endsWith('.css'));
  }

  if (config.origin === '') {
    console.error(
      `WARN: Remember to put a valid "origin" in your elder.config.js. This should be a fully qualified domain. This is frequently used plugins and leaving it blank can cause SEO headaches.`,
    );
  }

  return config;
}

export default getConfig;
