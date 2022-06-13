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

type TGetFilesAndWatcher = {
  clientComponents: string;
  ssrComponents: string;
  production: boolean;
} & Pick<SettingsOptions, 'server' | 'build' | 'srcDir' | 'rootDir'>;

export default function getFilesAndWatcher(settings: TGetFilesAndWatcher): {
  client: string[];
  server: string[];
  watcher: EventEmitter;
} {
  const watcher = new EventEmitter();
  const paths = [
    `${settings.srcDir}/**/*.js`,
    `${settings.ssrComponents}/**/*.js`,
    `${settings.clientComponents}/**/*.js`,
  ];

  const initialFiles = fg.sync(paths);

  let server: string[] = [];
  let client: string[] = [];

  if (!settings.production && settings.server) {
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
      } else if (file.includes(settings.ssrComponents)) {
        const ef = path.relative(settings.ssrComponents, file);
        watcher.emit('ssr', ef);

        const idx = server.findIndex((f) => f.includes(file));
        server[idx] = hashUrl(windowsPathFix(file));
      } else if (file.includes(settings.clientComponents)) {
        const ef = path.relative(settings.clientComponents, file);
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
  server = initialFiles
    .filter((f) => f.includes(settings.ssrComponents))
    .map(hashUrl)
    .map(windowsPathFix);
  client = initialFiles.filter((f) => f.includes(settings.clientComponents)).map(windowsPathFix);

  return { server, client, watcher };
}
