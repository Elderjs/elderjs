import { fork } from 'child_process';
import path from 'path';
import * as url from 'url';
import { SettingsOptions } from '..';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/// @ts-ignore
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default function bundle(settings: SettingsOptions) {
  return new Promise((resolve) => {
    if (settings.worker) {
      resolve(true);
    } else {
      const forked = fork(path.join(__dirname, '../esbuild/esbuildWorker.js'));
      forked.on('message', (msg) => {
        if (msg === 'complete') {
          resolve(true);
        }
      });
    }
  });
}
