import { cosmiconfigSync } from 'cosmiconfig';
import defaultsDeep from 'lodash.defaultsdeep';
import path from 'path';
import { ConfigOptions } from './types';
import { getDefaultConfig } from './validations';

function getConfig(): ConfigOptions {
  const explorerSync = cosmiconfigSync('elder');
  const explorerSearch = explorerSync.search();
  let loadedConfig = {};
  if (explorerSearch && explorerSearch.config) {
    loadedConfig = explorerSearch.config;
  }

  const defaultConfig = getDefaultConfig();
  const config: ConfigOptions = defaultsDeep(loadedConfig, defaultConfig);

  const rootDir = config.rootDir === 'process.cwd()' ? process.cwd() : path.resolve(config.rootDir);
  config.rootDir = rootDir;
  config.srcDir = path.resolve(rootDir, `./${config.srcDir}`);
  config.distDir = path.resolve(rootDir, `./${config.distDir}`);

  const ssrComponents = path.resolve(config.rootDir, './___ELDER___/compiled/');
  const clientComponents = path.resolve(config.distDir, './svelte/');

  config.$$internal = {
    ssrComponents,
    clientComponents,
  };

  return config;
}

export default getConfig;
