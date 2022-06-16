import hookInterface from '../hooks/hookInterface.js';
import { ProcessedHooksArray } from '../hooks/types.js';
import plugins from '../plugins/index.js';
import prepareRouter from '../routes/prepareRouter.js';
import routes from '../routes/routes.js';
import { ShortcodeDefinitions } from '../shortcodes/types.js';
import { prepareRunHook } from '../utils/index.js';

import {
  checkForDuplicatePermalinks,
  completeRequests,
  displayElderPerfTimings,
  Elder,
  filterHooks,
  getAllRequestsFromRoutes,
  getUserHooks,
  getUserShortcodes,
  makeElderjsHelpers,
  makeServerLookupObject,
} from './Elder.js';
import internalHooks from '../hooks/index.js';

import elderJsShortcodes from '../shortcodes/index.js';

export default async function bootstrap(elder: Elder) {
  elder.perf.start('startup');
  elder.settings.$$internal.status = 'bootstrapping';

  // plugins are run first as they have routes, hooks, and shortcodes.
  const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins(elder);
  // add meta to routes and collect hooks from routes
  const userRoutesJsFile = await routes(elder.settings);

  // plugins should never overwrite user routes.
  elder.routes = { ...pluginRoutes, ...userRoutesJsFile };

  // merge hooks arrays
  const hooksJs: ProcessedHooksArray = await getUserHooks(elder.settings.$$internal.files.hooks);
  const elderJsHooks: ProcessedHooksArray = internalHooks.map((hook) => ({
    priority: 50,
    ...hook,
    $$meta: {
      type: 'internal',
      addedBy: 'elder.js',
    },
  }));

  // merge hooks
  // hooks can be turned off for plugins, user, and elderjs by the elder.config.js
  elder.hooks = filterHooks(
    elder.settings.hooks.disable,
    [...elderJsHooks, ...pluginHooks, ...hooksJs].map((hook) => ({
      $$meta: {
        type: 'unknown',
        addedBy: 'unknown',
      },
      priority: 50,
      ...hook,
    })),
  );

  // merge shortcodes
  const shortcodesJs: ShortcodeDefinitions = await getUserShortcodes(elder.settings.$$internal.files.shortcodes);
  // user shortcodes first
  elder.shortcodes = [...shortcodesJs, ...elderJsShortcodes, ...pluginShortcodes];

  /**
   *
   * Almost ready for customize hooks and bootstrap
   * Just wire up the last few things.
   */

  elder.data = {};
  elder.query = {};
  elder.allRequests = [];
  elder.serverLookupObject = {};
  elder.errors = [];
  elder.hookInterface = hookInterface;

  elder.helpers = makeElderjsHelpers(elder.routes, elder.settings);

  // customizeHooks should not be used by plugins. Plugins should use their own closure to manage data and be side effect free.
  const hooksMinusPlugins = elder.hooks.filter((h) => h.$$meta.type !== 'plugin');
  elder.runHook = prepareRunHook({
    hooks: hooksMinusPlugins,
    allSupportedHooks: hookInterface,
    settings: elder.settings,
  });

  await elder.runHook('customizeHooks', elder);
  // we now have any customizations to the hookInterface.
  // we need to rebuild runHook with these customizations.
  elder.runHook = prepareRunHook({
    hooks: elder.hooks,
    allSupportedHooks: elder.hookInterface,
    settings: elder.settings,
  });

  await elder.runHook('bootstrap', elder);

  /** get all of the requests */
  elder.perf.start('startup.routes');
  elder.allRequests = await getAllRequestsFromRoutes(elder);
  elder.perf.end(`startup.routes`);

  await elder.runHook('allRequests', elder);

  /** setup permalinks and server lookup object */
  elder.perf.start(`startup.setPermalinks`);
  elder.allRequests = await completeRequests(elder);
  if (elder.settings.context === 'server') {
    elder.serverLookupObject = makeServerLookupObject(elder.allRequests);
  }
  elder.perf.end(`startup.setPermalinks`);

  elder.perf.start(`startup.validatePermalinks`);
  checkForDuplicatePermalinks(elder.allRequests);
  elder.perf.end(`startup.validatePermalinks`);

  elder.perf.start(`startup.prepareRouter`);
  elder.router = prepareRouter(elder);
  elder.perf.end(`startup.prepareRouter`);

  elder.perf.end('startup');

  elder.perf.stop();

  displayElderPerfTimings('Elder.js Startup', elder);

  elder.settings.$$internal.status = 'bootstrapped';
  elder.markBootstrapComplete(elder);
}
