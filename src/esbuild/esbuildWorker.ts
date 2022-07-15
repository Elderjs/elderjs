// watches svelte files and bundles them

// is given a file name and returns compiled ts code.

import { SettingsOptions } from '../utils/types.js';
import esbuildBundler from './esbuildBundler.js';

process.send('ready');

process.on('message', (msg) => {
  if (msg[0] === 'start') {
    const settings = msg[1] as SettingsOptions;
    esbuildBundler(settings)
      .then(() => {
        process.send('complete');
        if (settings.build) process.exit();
      })
      .catch(console.error);
  }
});
