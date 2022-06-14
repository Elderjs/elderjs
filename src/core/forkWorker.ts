import { fork } from 'child_process';
import path from 'path';
import * as url from 'url';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/// @ts-ignore
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default function forkWorker() {
  return new Promise((resolve) => {
    const forked = fork(path.join(__dirname, '../esbuild/esbuildWorker.js'));

    forked.on('message', (msg) => {
      console.log('message on parent', msg);
      if (msg === 'complete') resolve(true);
    });
  });
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
