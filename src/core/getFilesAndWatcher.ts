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

export function makePublicCssRelative({ file, distElder }: { file: string; distElder: string }) {
  return file ? `/${path.relative(distElder, file)}` : '';
}

type TGetFilesAndWatcher = {
  clientComponents: string;
  ssrComponents: string;
  production: boolean;
  distElder: string;
} & Pick<SettingsOptions, 'server' | 'build' | 'srcDir' | 'rootDir' | 'distDir'>;

export default function getFilesAndWatcher(settings: TGetFilesAndWatcher): {
  files: {
    client: string[];
    server: string[];
    routes: string[];
    all: string[];
    hooks: string;
    shortcodes: string;

    publicCssFile: string;
  };
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
    `${settings.distElder}/assets/*.css`,
  ];

  const all = fg.sync(paths).map(windowsPathFix);

  const files = {
    all,
    publicCssFile: makePublicCssRelative({
      file: all.find((p) => p.endsWith('.css')),
      distElder: settings.distDir,
    }),
    server: all.filter((f) => f.includes(settings.ssrComponents)).map(hashUrl),
    routes: all
      .filter((f) => f.includes(path.join(settings.srcDir, './routes/')) && f.toLowerCase().endsWith('route.js'))
      .map(hashUrl),
    hooks: hashUrl(all.find((f) => f === path.join(settings.srcDir, './hooks.js'))),
    shortcodes: hashUrl(all.find((f) => f === path.join(settings.srcDir, './shortcodes.js'))),
    // already hashed
    client: all.filter((f) => f.includes(settings.clientComponents)),
  };
  console.log(`initial public`, files.publicCssFile);

  if (!settings.production && settings.server) {
    // todo: add in plugin folders for Elder.js
    const chok = chokidar.watch(paths, { alwaysStat: true, usePolling: true });

    const chokFiles: Map<string, Stats> = new Map();

    // eslint-disable-next-line no-inner-declarations
    function handleChange(file: string) {
      const f = path.relative(settings.srcDir, file);
      if (f.startsWith('routes')) {
        if (f.endsWith('route.js')) {
          if (!files.routes.includes(file)) files.routes.push(file);
          watcher.emit('route', hashUrl(file));
        } else {
          // find nearest route.
          const routePaths = files.routes.map((r) => unhashUrl(r).replace('route.js', ''));
          const found = routePaths.find((r) => file.includes(r));
          watcher.emit('route', hashUrl(`${found}route.js`));
        }
      } else if (f.endsWith('.css')) {
        files.publicCssFile = makePublicCssRelative({
          file,
          distElder: settings.distDir,
        });
        console.log(`new public`, files.publicCssFile);
      } else if (f === 'hooks.js') {
        watcher.emit('hooks', hashUrl(file));
      } else if (f === 'shortcodes.js') {
        watcher.emit('shortcodes', hashUrl(file));
      } else if (file.includes(settings.ssrComponents)) {
        watcher.emit('ssr', hashUrl(file));
        const idx = files.server.findIndex((f) => f.includes(file));
        files.server[idx] = hashUrl(windowsPathFix(file));
      } else if (file.includes(settings.clientComponents)) {
        watcher.emit('client', hashUrl(file));
      } else if (file.endsWith(`elder.config.js`)) {
        watcher.emit('elder.config', hashUrl(file));
      }
      files.all = [...chokFiles.keys()];
    }

    let initialScanComplete = false;
    chok.on('add', (file, stat) => {
      chokFiles.set(file, stat);
      if (initialScanComplete) {
        handleChange(file);
      }
    });

    chok.on('change', (file, stat) => {
      if (!chokFiles.has(file) || chokFiles.get(file).size !== stat.size) {
        chokFiles.set(file, stat);
        handleChange(file);
      }
    });

    chok.on('unlink', (file) => {
      chokFiles.delete(file);
      if (file === files.publicCssFile) files.publicCssFile = '';
    });

    chok.on('ready', () => {
      initialScanComplete = true;
    });
  }

  return { files, watcher };
}
