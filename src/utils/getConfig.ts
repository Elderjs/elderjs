import { cosmiconfigSync } from 'cosmiconfig';
import defaultsDeep from 'lodash.defaultsdeep';
import path from 'path';
import fs from 'fs-extra';
import { SettingsOptions, InitializationOptions } from './types.js';
import { getDefaultConfig } from './validations.js';
import prepareFindSvelteComponent from '../partialHydration/prepareFindSvelteComponent.js';
import normalizePrefix from './normalizePrefix.js';
import notProduction from './notProduction.js';
import getFilesAndWatcher from '../core/getFilesAndWatcher.js';

type TCheckCssFiles = {
  cssFiles: string[];
  assetPath: string;
  config: Partial<SettingsOptions>;
  serverPrefix: string;
};
export function getCssFile({ cssFiles, serverPrefix, config, assetPath }: TCheckCssFiles): string {
  if (cssFiles.length > 1) {
    throw new Error(
      `${config.$$internal.logPrefix} Race condition has caused multiple css files in ${assetPath}. If you keep seeing this delete the _elder and ___ELDER___  folders.`,
    );
  }
  if (!cssFiles[0]) {
    throw new Error(`CSS file not found in ${assetPath}`);
  }
  return `${serverPrefix}/_elderjs/assets/${cssFiles[0]}`;
}

function getConfig(initializationOptions: InitializationOptions = {}): SettingsOptions {
  let loadedConfig: InitializationOptions = {};
  const explorerSync = cosmiconfigSync('elder');
  const explorerSearch = explorerSync.search();
  if (explorerSearch && explorerSearch.config) {
    loadedConfig = explorerSearch.config;
  }
  const config: SettingsOptions = defaultsDeep(initializationOptions, loadedConfig, getDefaultConfig());

  const serverPrefix = normalizePrefix(config.prefix || (config.server && config.server.prefix));

  const rootDir = config.rootDir === 'process.cwd()' ? process.cwd() : path.resolve(config.rootDir);
  config.rootDir = rootDir;
  config.srcDir = path.resolve(rootDir, `./${config.srcDir}`);
  config.distDir = path.resolve(rootDir, `./${config.distDir}`);

  const ejsPkg = path.resolve(`./node_modules/@elderjs/elderjs/package.json`);
  let pkgJson;
  if (fs.existsSync(ejsPkg)) {
    pkgJson = fs.readJSONSync(ejsPkg);
  } else {
    pkgJson = { version: 'unknown' };
  }

  config.version = pkgJson.version.includes('-') ? pkgJson.version.split('-')[0] : pkgJson.version;

  config.context = typeof initializationOptions.context !== 'undefined' ? initializationOptions.context : 'unknown';

  config.server = initializationOptions.context === 'server' && config.server;
  config.build = initializationOptions.context === 'build' && config.build;
  config.worker = !!initializationOptions.worker;
  config.prefix = serverPrefix;
  if (serverPrefix && config.server) {
    config.server.prefix = serverPrefix;
  }

  const ssrComponents = path.resolve(config.rootDir, './___ELDER___/compiled/');
  const clientComponents = path.resolve(config.distDir, `.${serverPrefix}/_elderjs/svelte/`);
  const distElder = path.resolve(config.distDir, `.${serverPrefix}/_elderjs/`);
  fs.ensureDirSync(path.resolve(distElder));
  fs.ensureDirSync(path.resolve(clientComponents));

  const { server, client, watcher } = getFilesAndWatcher({
    ...config,
    production: !notProduction(),
    clientComponents,
    ssrComponents,
  });

  config.$$internal = {
    production: !notProduction(),
    ssrComponents,
    clientComponents,
    distElder,
    logPrefix: `[Elder.js]:`,
    serverPrefix,
    findComponent: prepareFindSvelteComponent({
      clientComponents: client,
      ssrComponents: server,
      rootDir,
      srcDir: config.srcDir,
    }),
    files: {
      server,
      client,
    },
    watcher,
  };

  if ((config.css === 'file' || config.css === 'lazy') && initializationOptions.context !== 'test') {
    const assetPath = path.resolve(distElder, `.${path.sep}assets`);
    fs.ensureDirSync(path.resolve(assetPath));
    const cssFiles = fs.readdirSync(assetPath).filter((f) => f.endsWith('.css'));
    config.$$internal.publicCssFile = getCssFile({ cssFiles, serverPrefix, config, assetPath });
  }

  if (config.origin === '' || config.origin === 'https://example.com') {
    console.error(
      `WARN: Remember to put a valid "origin" in your elder.config.js. The URL of your site's root, without a trailing slash. This is frequently used by plugins and leaving it blank can cause SEO headaches.`,
    );
  }

  return config;
}

export default getConfig;
