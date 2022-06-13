import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import path from 'path';
import fg from 'fast-glob';

import { SettingsOptions } from '..';
import { Stats } from 'fs';
import getUniqueId from '../utils/getUniqueId.js';
import windowsPathFix from '../utils/windowsPathFix.js';

export function hashUrl(url: string) {
  return `${url}?hash=${getUniqueId()}`;
}

export function unhashUrl(url: string) {
  return url.split('?')[0];
}

type TGetFilesAndWatcher = {
  clientComponents: string;
  ssrComponents: string;
  production: boolean;
} & Pick<SettingsOptions, 'server' | 'build' | 'srcDir' | 'rootDir'>;

export default function getFilesAndWatcher(settings: TGetFilesAndWatcher): {
  client: string[];
  server: string[];
  routes: string[];
  all: string[];
  hooks: string;
  shortcodes: string;
  watcher: EventEmitter;
} {
  const watcher = new EventEmitter();
  const paths = [
    `${settings.srcDir}/**/*`,
    // `${settings.srcDir}/**/*.js`,
    `${settings.ssrComponents}/**/*.js`,
    `${settings.clientComponents}/**/*.js`,
    // `${settings.srcDir}/**/*.svelte`,
    `${settings.srcDir}/elder.config.cjs`,
  ];

  let all: string[] = fg.sync(paths).map(windowsPathFix);

  let server: string[] = all.filter((f) => f.includes(settings.ssrComponents)).map(hashUrl);
  let routes: string[] = all
    .filter((f) => f.includes(path.join(settings.srcDir, './routes/')) && f.toLowerCase().endsWith('route.js'))
    .map(hashUrl);
  let hooks: string = hashUrl(all.find((f) => f === path.join(settings.srcDir, './hooks.js')));
  let shortcodes: string = hashUrl(all.find((f) => f === path.join(settings.srcDir, './shortcodes.js')));

  // already hashed
  let client: string[] = all.filter((f) => f.includes(settings.clientComponents));

  if (!settings.production && settings.server) {
    // todo: add in plugin folders for Elder.js
    const chok = chokidar.watch(paths, { alwaysStat: true, usePolling: true });

    const chokFiles: Map<string, Stats> = new Map();

    function handleChange(file: string, stat: Stats) {
      const f = path.relative(settings.srcDir, file);
      if (f.startsWith('routes')) {
        if (f.endsWith('route.js')) {
          if (!routes.includes(file)) routes.push(file);
          watcher.emit('route', hashUrl(file));
        } else {
          // find nearest route.
          const routePaths = routes.map((r) => unhashUrl(r).replace('route.js', ''));
          const found = routePaths.find((r) => file.includes(r));

          console.log(found, file, routePaths, hashUrl(`${found}route.js`));
          watcher.emit('route', hashUrl(`${found}route.js`));
        }
      } else if (f === 'hooks.js') {
        watcher.emit('hooks', hashUrl(file));
      } else if (f === 'shortcodes.js') {
        watcher.emit('shortcodes', hashUrl(file));
      } else if (file.includes(settings.ssrComponents)) {
        watcher.emit('ssr', hashUrl(file));
        const idx = server.findIndex((f) => f.includes(file));
        server[idx] = hashUrl(windowsPathFix(file));
      } else if (file.includes(settings.clientComponents)) {
        watcher.emit('client', hashUrl(file));
      } else if (file.endsWith(`elder.config.js`)) {
        watcher.emit('elder.config', hashUrl(file));
      }
      all = [...chokFiles.keys()];
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

  return { server, client, watcher, hooks, shortcodes, routes, all };
}
