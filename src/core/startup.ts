import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import path from 'path';
import fg from 'fast-glob';

import { SettingsOptions } from '..';
import { Stats } from 'fs';
import getUniqueId from '../utils/getUniqueId.js';
import windowsPathFix from '../utils/windowsPathFix.js';

// // spawns a watcher to watch for new files and file changes.

// const watcher = new EventEmitter();

// watcher.on('route', () => {
//   /// routes
//   /// when a route changes, it needs to reload the route, merge new requests into all requests again... generate permalinks.'
//   /// needs to rerun the allRequests hook
//   /// need to rebuild all permalinks for this hook
//   /// needs to rebuild helpers.permalinks
// });
// watcher.on('hooks', () => {
//   /// hook files
//   /// load and validate hooks
//   /// redefine runHook
//   /// rerun hooks.
//   // option 1:
//   /// hash the individual hook definitions for "allRequests", "bootstrap", "customizeHooks"
//   /// if the hash is different, then rerun the hooks
//   /// option 2: just rerun everything from customizeHooks
// });
// watcher.on('shortcodes', () => {
//   // reload shortocdes...
// });
// watcher.on('svelteServerComponent', () => {
//   // updates findSvelteComponent... probably clearing the cache.
// });
// watcher.on('plugin', () => {});

// watcher.on('elderjsChange', () => {});

// // loads plugins

export function hashUrl(url: string) {
  return `${url}?hash=${getUniqueId()}`;
}

export function getElderFiles({
  settings,
}: {
  settings: Pick<SettingsOptions, 'server' | 'build' | '$$internal' | 'srcDir' | 'rootDir'>;
}): { ssrComponents: string[]; clientComponents: string[]; watcher: EventEmitter } {
  const watcher = new EventEmitter();
  const paths = [
    `${settings.srcDir}/**/*.js`,
    `${settings.$$internal.ssrComponents}/**/*.js`,
    `${settings.$$internal.clientComponents}/**/*.js`,
  ];

  const initialFiles = fg.sync(paths);

  let ssrComponents: string[] = [];
  let clientComponents: string[] = [];

  if (!settings.$$internal.production && settings.server) {
    // todo: add in plugin folders for Elder.js
    const chok = chokidar.watch(paths, { alwaysStat: true, usePolling: true });

    const chokFiles: Map<string, Stats> = new Map();

    function handleChange(file: string, stat: Stats) {
      const f = path.relative(settings.srcDir, file);
      if (f.startsWith('routes')) {
        watcher.emit('route', f);
      } else if (f === 'hooks.js') {
        watcher.emit('hooks', f);
      } else if (f === 'shortcodes.js') {
        watcher.emit('shortcodes', f);
      } else if (file.includes(settings.$$internal.ssrComponents)) {
        const ef = path.relative(settings.$$internal.ssrComponents, file);
        watcher.emit('ssr', ef);
        console.log('ssr', ef);
      } else if (file.includes(settings.$$internal.clientComponents)) {
        const ef = path.relative(settings.$$internal.clientComponents, file);
        watcher.emit('client', ef);
        console.log('client', ef);
      }
    }

    let initialScanComplete = false;
    chok.on('add', (file, stat) => {
      chokFiles.set(file, stat);
      if (initialScanComplete) {
        handleChange(file, stat);
      }
    });

    chok.on('change', (file, stat) => {
      if (!chokFiles.has(file) || chokFiles.get(file).size !== stat.size) {
        chokFiles.set(file, stat);
        handleChange(file, stat);
      }
    });

    chok.on('unlink', (file) => {
      chokFiles.delete(file);
    });

    chok.on('ready', () => {
      initialScanComplete = true;
    });
  }

  console.log(initialFiles);
  ssrComponents = initialFiles
    .filter((f) => f.includes(settings.$$internal.ssrComponents))
    .map(hashUrl)
    .map(windowsPathFix);
  clientComponents = initialFiles.filter((f) => f.includes(settings.$$internal.clientComponents)).map(windowsPathFix);

  return { ssrComponents, clientComponents, watcher };
}

export default async function startup(
  settings: Pick<SettingsOptions, 'server' | 'build' | '$$internal' | 'srcDir' | 'rootDir'>,
) {
  return;
}

/////////////

// esbuild worker
// bundles svelte files

// watcher
/// detects file changes and manages the loading of files an refreshing internal app data.
/// needs to be able to handle file changes and new additions.

/// would need to watch changes to:

/// svelte server files
/// when a svelte server file changes, the next import of that component should have a different querystring. (prob timestamp of change.)
/// This allows for restartless refreshing of components.

/// svelte client component
/// do nothing... client components will be loaded on the client.

/// shortcode file
/// reload shortcodes

/// plugin file... in plugin folder?

// will need to bundle all files on startup... the first time.
