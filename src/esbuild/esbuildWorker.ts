// watches svelte files and bundles them

// is given a file name and returns compiled ts code.

import esbuildBundler from './esbuildBundler.js';

process.send('ready');

process.on('message', (msg) => {
  if (msg[0] === 'start') {
    esbuildBundler(msg[1])
      .then(() => {
        process.send('complete');
      })
      .catch(console.error);
  }
});
