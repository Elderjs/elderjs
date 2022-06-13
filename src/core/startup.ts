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
