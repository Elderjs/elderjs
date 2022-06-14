// watches svelte files and bundles them

// is given a file name and returns compiled ts code.

import esbuildBundler from './esbuildBundler.js';

esbuildBundler({})
  .then((complete) => {
    console.log(complete);
    process.send('complete');
  })
  .catch(console.error);
