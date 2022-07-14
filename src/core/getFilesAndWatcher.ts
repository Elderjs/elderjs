import { EventEmitter } from 'events';
import chokidar from 'chokidar';
import path, { sep } from 'path';
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

export function makeCssRelative({ file, distElder }: { file: string; distElder: string }) {
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
    `${settings.ssrComponents}/**/*.js`,
    `${settings.clientComponents}/**/*.js`,
    `${settings.rootDir}/elder.config.cjs`,
    `${settings.rootDir}/elder.config.js`,
    `${settings.distDir}/**/*.css`,
  ];

  const all = fg.sync(paths).map(windowsPathFix);

  const shortcodeFile = all.find((f) => f === path.join(settings.srcDir, './shortcodes.js'));
  const hooksFile = all.find((f) => f === path.join(settings.srcDir, './hooks.js'));
  const files = {
    all,
    publicCssFile: makeCssRelative({
      file: all.find((p) => p.includes(`assets${sep}svelte`) && p.endsWith('.css')),
      distElder: settings.distDir,
    }),
    server: all.filter((f) => f.includes(settings.ssrComponents)).map(hashUrl),
    routes: all
      .filter((f) => f.includes(path.join(settings.srcDir, './routes/')) && f.toLowerCase().endsWith('route.js'))
      .map(hashUrl),
    hooks: hooksFile ? hashUrl(hooksFile) : '',
    shortcodes: shortcodeFile ? hashUrl(shortcodeFile) : '',
    // already hashed
    client: all.filter((f) => f.includes(settings.clientComponents)),
  };

  if (!settings.production && settings.server) {
    // todo: add in plugin folders for Elder.js
    const chok = chokidar.watch(paths, { alwaysStat: true, usePolling: true });

    // these are unhashed.
    const chokFiles: Map<string, Stats> = new Map();

    // eslint-disable-next-line no-inner-declarations
    function handleChange(file: string) {
      const fixedFile = windowsPathFix(file);
      const f = path.relative(settings.srcDir, file);
      if (f.startsWith('routes') && !f.endsWith('svelte')) {
        if (f.endsWith('route.js')) {
          if (!files.routes.includes(file)) files.routes.push(file);
          watcher.emit('route', hashUrl(file));
        } else {
          // find nearest route.
          const routePaths = files.routes.map((r) => unhashUrl(r).replace('route.js', ''));
          const found = routePaths.find((r) => file.includes(r));
          if (found) {
            watcher.emit('route', hashUrl(`${found}route.js`));
          }
        }
      } else if (f.endsWith('.css') && f.includes('svelte-')) {
        files.publicCssFile = makeCssRelative({
          file,
          distElder: settings.distDir,
        });
        watcher.emit('publicCssFile', files.publicCssFile);
      } else if (f === 'hooks.js') {
        watcher.emit('hooks', hashUrl(file));
      } else if (f === 'shortcodes.js') {
        watcher.emit('shortcodes', hashUrl(file));
      } else if (file.includes(settings.ssrComponents)) {
        const idx = files.server.findIndex((f) => f.includes(fixedFile));
        files.server[idx] = hashUrl(fixedFile);
        watcher.emit('ssr', hashUrl(fixedFile));
      } else if (file.includes(settings.clientComponents)) {
        const withoutHash = fixedFile.split('.')[0];
        const idx = files.client.findIndex((f) => f.includes(withoutHash));
        files.client[idx] = fixedFile;
        watcher.emit('client', fixedFile);
      } else if (file.endsWith(`elder.config.js`) || file.endsWith(`elder.config.cjs`)) {
        watcher.emit('elder.config', hashUrl(file));
        // } else if (file.endsWith('.css')) {
        // watcher.emit('otherCssFile', makeCssRelative({ file, distElder: settings.distDir }));
      } else if (file.endsWith(`${settings.srcDir}/helpers/index.js`)) {
        watcher.emit('helpers', hashUrl(file));
      } else {
        // console.log('other file', file);
      }

      if (file.includes(settings.srcDir)) {
        watcher.emit('srcChange', file);
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
