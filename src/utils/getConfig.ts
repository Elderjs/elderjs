import defaultsDeep from 'lodash.defaultsdeep';
import path from 'path';
import fs from 'fs-extra';
import { SettingsOptions, InitializationOptions } from './types.js';
import { getDefaultConfig } from './validations.js';
import prepareFindSvelteComponent from '../partialHydration/prepareFindSvelteComponent.js';
import normalizePrefix from './normalizePrefix.js';
import notProduction from './notProduction.js';
import getFilesAndWatcher from '../core/getFilesAndWatcher.js';
import getWebsocket from '../core/getWebsocket.js';
import getUniqueId from './getUniqueId.js';

import { loadConfig } from 'unconfig';

export async function getElderConfig(cwd = process.cwd()) {
  const { config, sources } = await loadConfig({
    sources: [
      {
        files: 'elder.config',
        // default extensions
        extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs', 'json', ''],
      },
    ],
    cwd,
    merge: true,
  });
  return { config, sources };
}

async function getConfig(initializationOptions: InitializationOptions = {}): Promise<SettingsOptions> {
  let { config: loadedConfig = {}, sources: configFiles }: { config: InitializationOptions; sources: string[] } =
    await getElderConfig();

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

  const production = !notProduction();

  const { files, watcher } = getFilesAndWatcher({
    ...config,
    production,
    clientComponents,
    ssrComponents,
    distElder,
    configFiles,
  });

  config.$$internal = {
    reloadHash: getUniqueId(),
    production,
    ssrComponents,
    clientComponents,
    distElder,
    logPrefix: `[Elder.js]:`,
    serverPrefix,
    findComponent: prepareFindSvelteComponent({
      files,
      rootDir,
      srcDir: config.srcDir,
      production,
      distDir: config.distDir,
    }),
    files,
    watcher,
    websocket: undefined,
    status: 'bootstrapping',
  };

  if (!production && config.context === 'server') {
    config.$$internal.websocket = getWebsocket(config.$$internal, config.debug.reload);
  }

  if ((config.css === 'file' || config.css === 'lazy') && initializationOptions.context !== 'test') {
    const assetPath = path.resolve(distElder, `.${path.sep}assets`);
    fs.ensureDirSync(path.resolve(assetPath));
  }

  if (config.build && (config.origin === '' || config.origin === 'https://example.com')) {
    console.error(
      `WARN: Remember to put a valid "origin" in your elder.config.js. The URL of your site's root, without a trailing slash. This is frequently used by plugins and leaving it blank can cause SEO headaches.`,
    );
  }

  return config;
}

export default getConfig;
