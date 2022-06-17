import { ProcessedHooksArray } from '../hooks/types.js';
import plugins from '../plugins/index.js';
import routes from '../routes/routes.js';
import { ShortcodeDefinitions } from '../shortcodes/types.js';

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
import { pbrReplaceArray, pbrReplaceObject } from './passByReferenceUtils.js';

export default async function bootstrap(elder: Elder) {
  elder.perf.start('startup');
  elder.settings.$$internal.status = 'bootstrapping';

  // plugins are run first as they have routes, hooks, and shortcodes.
  const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins(elder);
  // add meta to routes and collect hooks from routes
  const userRoutesJsFile = await routes(elder.settings);

  // plugins should never overwrite user routes.
  pbrReplaceObject(elder.routes, { ...pluginRoutes, ...userRoutesJsFile });

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

  // PASS BY REFERENCE!
  // hooks can be turned off for plugins, user, and elderjs by the elder.config.js
  pbrReplaceArray(
    elder.hooks,
    filterHooks(
      elder.settings.hooks.disable,
      [...elderJsHooks, ...pluginHooks, ...hooksJs].map((hook) => ({
        $$meta: {
          type: 'unknown',
          addedBy: 'unknown',
        },
        priority: 50,
        ...hook,
      })),
    ),
  );

  // merge shortcodes
  const shortcodesJs: ShortcodeDefinitions = await getUserShortcodes(elder.settings.$$internal.files.shortcodes);
  // user shortcodes first
  pbrReplaceArray(elder.shortcodes, [...shortcodesJs, ...elderJsShortcodes, ...pluginShortcodes]);

  elder.helpers = makeElderjsHelpers(elder.routes, elder.settings);

  // customizeHooks should not be used by plugins. Plugins should use their own closure to manage data and be side effect free.
  const hooksMinusPlugins = elder.hooks.filter((h) => h.$$meta.type !== 'plugin');

  elder.updateRunHookHooks(hooksMinusPlugins);

  await elder.runHook('customizeHooks', elder);
  // we now have any customizations to the hookInterface.
  // we need to rebuild runHook with these customizations.
  elder.updateRunHookHookInterface(elder.hookInterface);
  elder.updateRunHookHooks(elder.hooks);

  await elder.runHook('bootstrap', elder);

  /** get all of the requests */
  elder.perf.start('startup.routes');
  const newRequests = await getAllRequestsFromRoutes(elder);
  pbrReplaceArray(elder.allRequests, newRequests);
  elder.perf.end(`startup.routes`);

  await elder.runHook('allRequests', elder);

  /** setup permalinks and server lookup object */
  elder.perf.start(`startup.setPermalinks`);
  await completeRequests(elder);
  if (elder.settings.context === 'server') {
    pbrReplaceObject(elder.serverLookupObject, makeServerLookupObject(elder.allRequests));
  }
  elder.perf.end(`startup.setPermalinks`);

  elder.perf.start(`startup.validatePermalinks`);
  checkForDuplicatePermalinks(elder.allRequests);
  elder.perf.end(`startup.validatePermalinks`);

  elder.perf.end('startup');

  elder.perf.stop();

  displayElderPerfTimings('Elder.js Startup', elder);

  elder.settings.$$internal.status = 'bootstrapped';
  elder.markBootstrapComplete(elder);
}
