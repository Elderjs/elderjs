import path from 'path';
import { Elder } from '../index.js';
import prepareRouter from '../routes/prepareRouter.js';
import { prepareRoute } from '../routes/routes.js';
import windowsPathFix from '../utils/windowsPathFix.js';
import bootstrap from './bootstrap.js';
import {
  makeElderjsHelpers,
  runAllRequestOnRoute,
  completeRequests,
  makeServerLookupObject,
  displayElderPerfTimings,
  getUserHooks,
  getUserShortcodes,
} from './Elder.js';

export default function configureWatcher(elder: Elder) {
  elder.settings.$$internal.watcher.on('route', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    elder.perf.reset();
    elder.perf.start('stateRefresh');
    /**
     * Route Change: As of 6/13/2022:
     * when a route changes, it needs to reload the route... then:
     * update the routes object
     * needs to rebuild helpers.permalinks
     * need to wipe out the data object, then run the bootstrap hook
     * run the route's all function
     * filter out prior requests from allRequests... and replace with new requests
     * needs to rerun the allRequests hook
     * need to rebuild all permalinks
     * needs to rebuild the server lookup object.
     * need to check for duplicate permalinks.
     * rebuild the router
     */

    const newRoute = await prepareRoute({ file, settings: elder.settings });
    if (newRoute) {
      elder.routes = {
        ...elder.routes,
        [newRoute.name]: newRoute,
      };

      elder.routes[newRoute.name] = newRoute;
      elder.helpers = makeElderjsHelpers(elder.routes, elder.settings);

      elder.data = {};
      await elder.runHook('bootstrap', elder);

      const newRequests = await runAllRequestOnRoute({ route: newRoute, ...elder });

      elder.allRequests = [
        ...elder.allRequests.filter((r) => !(r.route === newRoute.name && r.source === 'routejs')),
        ...newRequests,
      ];

      await elder.runHook('allRequests', elder);

      elder.allRequests = await completeRequests(elder);

      elder.serverLookupObject = makeServerLookupObject(elder.allRequests);

      elder.router = prepareRouter(elder);

      elder.perf.end('stateRefresh');

      displayElderPerfTimings(`Refreshed ${newRoute.name} route`, elder);
      elder.settings.$$internal.websocket.send({ type: 'reload', file });
    }
  });
  elder.settings.$$internal.watcher.on('hooks', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    elder.perf.reset();
    elder.perf.start('stateRefresh');

    /**
     * PASS BY REFERENCE! MUST MUTATE THE elder.hooks array... not reassign.
     * When a hooks.js file changes we want to:
     * load the new file
     * look for any hooks that have changed by comparing the hook.run.toString()s
     * For the ones that changed, track the hooks that need to be rerun.
     * If customize hooks, bootstrap, or allRequests need to be rerun, do so in that order.
     *
     *
     * bootstrap
     * Bootstrap is the start of the data lifecylce so we need to destroy the data object before running it.
     *
     */

    const newHooks = await getUserHooks(file);

    const hooksToRun = new Set<string>();

    // loop through the existing hooks to collect those that haven't changed.
    const foundNewHooks = [];
    for (let i = 0; i < elder.hooks.length; i++) {
      const hook = elder.hooks[i];
      const idx = newHooks.findIndex(
        (h) => h.$$meta.addedBy === 'hooks.js' && h.hook === hook.hook && h.run.toString() === hook.run.toString(),
      );
      foundNewHooks.push(idx);
      if (idx < 0 && hook.$$meta.addedBy === 'hooks.js') {
        const [old] = elder.hooks.splice(i, 1);
        hooksToRun.add(old.hook);
      }
    }

    for (let i = 0; i < newHooks.length; i++) {
      if (foundNewHooks.includes(i)) continue;
      elder.hooks.unshift(newHooks[i]);
      hooksToRun.add(newHooks[i].hook);
    }

    if (hooksToRun.has('customizeHooks')) {
      console.log(
        `customizeHooks definitions can't be live reloaded. You'll need to restart the server or submit a PR.`,
      );
      // note: the issue is that all of elder works with pass by reference and we can't reassign the hookInterface or it breaks
      // runHook
    }

    if (hooksToRun.has('bootstrap')) {
      elder.data = {};
      elder.runHook('bootstrap', elder);
    }
    if (hooksToRun.has('allRequests')) elder.runHook('allRequests', elder);

    elder.allRequests = await completeRequests(elder);

    elder.serverLookupObject = makeServerLookupObject(elder.allRequests);

    elder.router = prepareRouter(elder);

    elder.perf.end('stateRefresh');

    displayElderPerfTimings(`Refreshed hooks.js`, elder);
    elder.settings.$$internal.websocket.send({ type: 'reload', file });
  });
  elder.settings.$$internal.watcher.on('shortcodes', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    elder.perf.reset();
    elder.perf.start('stateRefresh');
    const newShortcodes = await getUserShortcodes(file);

    // user shortcodes should always go first.
    elder.shortcodes = [...newShortcodes, ...elder.shortcodes.filter((s) => s.$$meta.addedBy !== 'shortcodes.js')];

    elder.perf.end('stateRefresh');
    displayElderPerfTimings(`Refreshed shortcodes.js`, elder);
    elder.settings.$$internal.websocket.send({ type: 'reload', file });
  });
  elder.settings.$$internal.watcher.on('ssr', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    elder.settings.$$internal.websocket.send({ type: 'reload', file });
  });
  elder.settings.$$internal.watcher.on('plugin', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    console.log('plugin', file);
  });
  elder.settings.$$internal.watcher.on('publicCssFile', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    elder.settings.$$internal.websocket.send({ type: 'publicCssChange', file });
  });
  elder.settings.$$internal.watcher.on('client', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    if (file.includes('components')) {
      const relPrefix = windowsPathFix(`${path.join(elder.settings.$$internal.distElder, '/svelte/components/')}`);
      elder.settings.$$internal.websocket.send({ type: 'componentChange', file: file.replace(relPrefix, '') });
    }
  });

  elder.settings.$$internal.watcher.on('otherCssFile', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    elder.settings.$$internal.websocket.send({ type: 'otherCssFile', file });
  });

  elder.settings.$$internal.watcher.on('elder.config', async (file) => {
    if (elder.settings.$$internal.status !== 'bootstrapped') return;
    console.log(`elder.config`, file);
  });

  // error reloading...
  elder.settings.$$internal.watcher.on('srcChange', (file) => {
    if (elder.settings.$$internal.status === 'errored') {
      console.log('--------------------------------', file);
      bootstrap(elder);
    }
  });
}
