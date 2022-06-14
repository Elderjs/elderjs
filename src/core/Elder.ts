import routes, { prepareRoute } from '../routes/routes.js';
import plugins from '../plugins/index.js';
import elderJsShortcodes from '../shortcodes/index.js';
import { hookInterface } from '../hooks/hookInterface.js';
import internalHooks from '../hooks/index.js';
import build from '../build/build.js';
import partialHydration from '../partialHydration/partialHydration.js';

import {
  prepareRunHook,
  prepareServer,
  validateShortcode,
  permalinks,
  getConfig,
  prepareInlineShortcode,
} from '../utils/index.js';
import { ProcessedRouteOptions, ProcessedRoutesObject } from '../routes/types.js';
import { HooksArray, ProcessedHooksArray, TRunHook } from '../hooks/types.js';
import { ShortcodeDefinitions } from '../shortcodes/types.js';
import {
  SettingsOptions,
  QueryOptions,
  RequestObject,
  ServerLookupObject,
  ExcludesFalse,
  InitializationOptions,
  THelpers,
  TErrors,
  AllRequests,
  DebugOptions,
} from '../utils/types';
import createReadOnlyProxy from '../utils/createReadOnlyProxy.js';
import workerBuild from '../workerBuild.js';
import { inlineSvelteComponent } from '../partialHydration/inlineSvelteComponent.js';

import prepareRouter from '../routes/prepareRouter.js';
import perf, { displayPerfTimings, Perf } from '../utils/perf.js';
import forkWorker from './forkWorker.js';
import windowsPathFix from '../utils/windowsPathFix.js';
import path from 'path';

class Elder {
  bootstrapComplete: Promise<Elder>;

  markBootstrapComplete: (e: Elder | PromiseLike<Elder>) => void;

  settings: SettingsOptions;

  routes: ProcessedRoutesObject;

  hooks: ProcessedHooksArray;

  data: Record<string, unknown>;

  runHook: TRunHook;

  query: QueryOptions;

  allRequests: Array<RequestObject>;

  serverLookupObject: ServerLookupObject;

  errors: TErrors;

  helpers: THelpers;

  server: ReturnType<typeof prepareServer>;

  hookInterface: typeof hookInterface;

  shortcodes: ShortcodeDefinitions;

  perf: Perf;

  uid: string;

  router: ReturnType<typeof prepareRouter>;

  constructor(initializationOptions: InitializationOptions = {}) {
    const initialOptions = { ...initializationOptions };
    this.bootstrapComplete = new Promise((resolve) => {
      this.markBootstrapComplete = resolve;
    });
    this.uid = 'startup';

    // merge the given config with the project and defaults;
    this.settings = getConfig(initializationOptions);

    // overwrite anything that needs to be overwritten for legacy reasons based on the initialConfig
    // todo: this can be refactored into getConfig.
    this.settings.context = typeof initialOptions.context !== 'undefined' ? initialOptions.context : 'unknown';
    this.settings.server = initialOptions.context === 'server' && this.settings.server;
    this.settings.build = initialOptions.context === 'build' && this.settings.build;
    this.settings.worker = !!initialOptions.worker;

    if (this.settings.context === 'server') {
      this.server = prepareServer({ bootstrapComplete: this.bootstrapComplete });
    }

    perf(this, true);

    this.perf.start('startup');

    forkWorker().then(async () => {
      // plugins are run first as they have routes, hooks, and shortcodes.
      const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins(this);
      // add meta to routes and collect hooks from routes
      const userRoutesJsFile = await routes(this.settings);

      // plugins should never overwrite user routes.
      this.routes = { ...pluginRoutes, ...userRoutesJsFile };

      // merge hooks arrays
      const hooksJs: ProcessedHooksArray = await getUserHooks(this.settings.$$internal.files.hooks);
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
      this.hooks = filterHooks(
        this.settings.hooks.disable,
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
      const shortcodesJs: ShortcodeDefinitions = await getUserShortcodes(this.settings.$$internal.files.shortcodes);
      // user shortcodes first
      this.shortcodes = [...shortcodesJs, ...elderJsShortcodes, ...pluginShortcodes];

      /**
       *
       * Almost ready for customize hooks and bootstrap
       * Just wire up the last few things.
       */

      this.data = {};
      this.query = {};
      this.allRequests = [];
      this.serverLookupObject = {};
      this.errors = [];
      this.hookInterface = hookInterface;

      this.helpers = makeElderjsHelpers(this.routes, this.settings);

      // customizeHooks should not be used by plugins. Plugins should use their own closure to manage data and be side effect free.
      const hooksMinusPlugins = this.hooks.filter((h) => h.$$meta.type !== 'plugin');
      this.runHook = prepareRunHook({
        hooks: hooksMinusPlugins,
        allSupportedHooks: hookInterface,
        settings: this.settings,
      });

      await this.runHook('customizeHooks', this);
      // we now have any customizations to the hookInterface.
      // we need to rebuild runHook with these customizations.
      this.runHook = prepareRunHook({
        hooks: this.hooks,
        allSupportedHooks: this.hookInterface,
        settings: this.settings,
      });

      await this.runHook('bootstrap', this);

      /** get all of the requests */
      this.perf.start('startup.routes');
      this.allRequests = await getAllRequestsFromRoutes(this);
      this.perf.end(`startup.routes`);

      await this.runHook('allRequests', this);

      /** setup permalinks and server lookup object */
      this.perf.start(`startup.setPermalinks`);
      this.allRequests = await completeRequests(this);
      if (this.settings.context === 'server') {
        this.serverLookupObject = makeServerLookupObject(this.allRequests);
      }
      this.perf.end(`startup.setPermalinks`);

      this.perf.start(`startup.validatePermalinks`);
      checkForDuplicatePermalinks(this.allRequests);
      this.perf.end(`startup.validatePermalinks`);

      this.perf.start(`startup.prepareRouter`);
      this.router = prepareRouter(this);
      this.perf.end(`startup.prepareRouter`);

      this.perf.end('startup');

      this.perf.stop();

      displayElderPerfTimings('Elder.js Startup', this);

      this.markBootstrapComplete(this);

      /**
       * Below handles reloading internal state as needed.
       */
      this.settings.$$internal.watcher.on('route', async (file) => {
        this.perf.reset();
        this.perf.start('stateRefresh');
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

        const newRoute = await prepareRoute({ file, settings: this.settings });
        if (newRoute) {
          this.routes = {
            ...this.routes,
            [newRoute.name]: newRoute,
          };

          this.routes[newRoute.name] = newRoute;
          this.helpers = makeElderjsHelpers(this.routes, this.settings);

          this.data = {};
          await this.runHook('bootstrap', this);

          const newRequests = await runAllRequestOnRoute({ route: newRoute, ...this });

          this.allRequests = [
            ...this.allRequests.filter((r) => !(r.route === newRoute.name && r.source === 'routejs')),
            ...newRequests,
          ];

          await this.runHook('allRequests', this);

          this.allRequests = await completeRequests(this);

          this.serverLookupObject = makeServerLookupObject(this.allRequests);

          this.router = prepareRouter(this);

          this.perf.end('stateRefresh');

          displayElderPerfTimings(`Refreshed ${newRoute.name} route`, this);
          this.settings.$$internal.websocket.send({ type: 'reload' });
        }
      });
      this.settings.$$internal.watcher.on('hooks', async (file) => {
        this.perf.reset();
        this.perf.start('stateRefresh');

        /**
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
        for (const hook of newHooks) {
          const idx = this.hooks.findIndex(
            (ch) =>
              ch.$$meta.addedBy === 'hooks.js' && ch.hook === hook.hook && ch.run.toString() !== hook.run.toString(),
          );
          if (idx !== -1) {
            const [spliced] = this.hooks.splice(idx, 1, hook);
            hooksToRun.add(spliced.hook);
          }
        }

        if (hooksToRun.has('customizeHooks')) {
          console.log(
            `customizeHooks definitions can't be live reloaded. You'll need to restart the server or submit a PR.`,
          );
          // note: the issue is that all of this works with pass by reference and we can't reassign the hookInterface or it breaks
          // runHook
        }

        if (hooksToRun.has('bootstrap')) {
          this.runHook('bootstrap', this);
          this.data = {};
        }
        if (hooksToRun.has('allRequests')) this.runHook('allRequests', this);

        this.allRequests = await completeRequests(this);

        this.serverLookupObject = makeServerLookupObject(this.allRequests);

        this.router = prepareRouter(this);

        this.perf.end('stateRefresh');
        displayElderPerfTimings(`Refreshed hooks.js`, this);
        this.settings.$$internal.websocket.send({ type: 'reload' });
      });
      this.settings.$$internal.watcher.on('shortcodes', async (file) => {
        this.perf.reset();
        this.perf.start('stateRefresh');
        const newShortcodes = await getUserShortcodes(file);

        // user shortcodes should always go first.
        this.shortcodes = [...newShortcodes, ...this.shortcodes.filter((s) => s.$$meta.addedBy !== 'shortcodes.js')];

        this.perf.end('stateRefresh');
        displayElderPerfTimings(`Refreshed shortcodes.js`, this);
        this.settings.$$internal.websocket.send({ type: 'reload' });
      });
      this.settings.$$internal.watcher.on('ssr', async (file) => {
        this.settings.$$internal.websocket.send({ type: 'reload' });
      });
      this.settings.$$internal.watcher.on('plugin', async (file) => {
        console.log('plugin', file);
      });
      this.settings.$$internal.watcher.on('publicCssFile', async (file) => {
        this.settings.$$internal.websocket.send({ type: 'publicCssChange', file });
      });
      this.settings.$$internal.watcher.on('client', async (file) => {
        if (file.includes('components')) {
          const relPrefix = windowsPathFix(`${path.join(this.settings.$$internal.distElder, '/svelte/components/')}`);
          this.settings.$$internal.websocket.send({ type: 'componentChange', file: file.replace(relPrefix, '') });
        }
      });

      this.settings.$$internal.watcher.on('elder.config', async (file) => {
        console.log(`elder.config`, file);
      });
    });
  }

  bootstrap() {
    return this.bootstrapComplete;
  }

  worker(workerRequests) {
    return workerBuild({ bootstrapComplete: this.bootstrapComplete, workerRequests });
  }
}

export function checkForDuplicatePermalinks(allRequests) {
  if (allRequests.length !== new Set(allRequests.map((r) => r.permalink)).size) {
    // useful error logging for when there are duplicate permalinks.
    for (let i = 0, l = allRequests.length; i < l; i += 1) {
      for (let ii = 0, li = allRequests.length; ii < li; ii += 1) {
        if (i !== ii && allRequests[i].permalink === allRequests[ii].permalink) {
          throw new Error(
            `Duplicate permalinks detected. Here are the relevant requests: ${JSON.stringify(
              allRequests[i],
            )} and ${JSON.stringify(allRequests[ii])}`,
          );
        }
      }
    }
  }
}

export async function getUserHooks(file) {
  try {
    const hooksReq = await import(file);
    const hookSrcFile: HooksArray = hooksReq.default || hooksReq;
    return hookSrcFile.map((hook) => ({
      priority: 50,
      ...hook,
      $$meta: {
        type: 'hooks.js',
        addedBy: 'hooks.js',
      },
    }));
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error(`Could not load hooks file from ${this.settings.$$internal.files.hooks}.`);
    } else {
      console.error(err);
    }
    return [];
  }
}

export async function getUserShortcodes(file) {
  try {
    const shortcodeReq = await import(file);
    const shortcodes: ShortcodeDefinitions = shortcodeReq.default || shortcodeReq;
    return shortcodes
      .map((shortcode) => ({
        ...shortcode,
        $$meta: {
          type: 'shortcodes.js',
          addedBy: 'shortcodes.js',
        },
      }))
      .map(validateShortcode)
      .filter((v) => v)
      .filter(Boolean as any as ExcludesFalse); // ts hack to force it to realize this is only items that are true
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error(`Could not load shortcodes file from ${file}. They are not required, but could be useful.`);
    } else {
      console.error(err);
    }
    return [];
  }
}

export function filterHooks(disable: undefined | false | string[], hooks: ProcessedHooksArray) {
  if (disable && disable.length > 0) {
    hooks = hooks.filter((h) => !disable.includes(h.name));
  }
  return hooks;
}

export async function runAllRequestOnRoute({
  route,
  settings,
  query,
  helpers,
  data,
  perf,
}: Pick<Elder, 'settings' | 'query' | 'data' | 'helpers' | 'perf'> & { route: ProcessedRouteOptions }) {
  perf.start(`startup.routes.${route.name}`);
  let allRequestsForRoute = [];
  if (typeof route.all === 'function') {
    allRequestsForRoute = await route.all({
      settings: createReadOnlyProxy(settings, 'settings', `${route.name} all function`),
      query: createReadOnlyProxy(query, 'query', `${route.name} all function`),
      helpers: createReadOnlyProxy(helpers, 'helpers', `${route.name} all function`),
      data: createReadOnlyProxy(data, 'data', `${route.name} all function`),
      perf: perf.prefix(`startup.routes.${route.name}.all`),
    });
  } else if (Array.isArray(route.all)) {
    allRequestsForRoute = route.all;
  }

  if (!Array.isArray(allRequestsForRoute)) {
    throw new Error(`${route.name}'s all() function isn't returning an array`);
  }

  perf.end(`startup.routes.${route.name}`);
  return allRequestsForRoute.map((r) => ({ ...r, route: route.name }));
}

export function makeElderjsHelpers(routes: ProcessedRoutesObject, settings: SettingsOptions) {
  return {
    permalinks: permalinks({ routes, settings: settings }),
    inlineSvelteComponent,
    shortcode: prepareInlineShortcode({ settings: settings }),
  };
}

export async function getAllRequestsFromRoutes(
  elder: Pick<Elder, 'routes' | 'data' | 'perf' | 'helpers' | 'settings' | 'query' | 'allRequests'>,
) {
  const allRequests = [];
  for (const route of Object.values(elder.routes)) {
    const routeRequests = await runAllRequestOnRoute({ route, ...elder });
    allRequests.push(...routeRequests);
  }
  return allRequests;
}

export async function addPermalinkToRequest({
  request,
  route,
  settings,
  helpers,
}: { request: RequestObject; route: ProcessedRouteOptions } & Pick<Elder, 'settings' | 'helpers'>) {
  if (!route || !route.permalink) {
    console.log(request);
    if (!request.route) {
      console.error(
        `Request is missing a 'route' key. This usually happens when request objects have been added to the allRequests array via a hook or plugin. ${JSON.stringify(
          request,
        )}`,
      );
    } else {
      console.error(
        `Request missing permalink but has request.route defined. This shouldn't be an Elder.js issue but if you believe it could be please create an issue. ${JSON.stringify(
          request,
        )}`,
      );
    }
  }

  const permalink = await route.permalink({
    request,
    settings: createReadOnlyProxy(settings, 'settings', `${request.route} permalink function`),
    helpers: createReadOnlyProxy(helpers, 'helpers', `${request.route} permalink function`),
  });

  return permalink;
}

export async function completeRequests(elder: Pick<Elder, 'allRequests' | 'settings' | 'helpers' | 'routes'>) {
  const requests = [];
  for (const request of elder.allRequests) {
    request.source = 'routejs';
    request.type = elder.settings.context;
    request.permalink = await addPermalinkToRequest({
      request,
      route: elder.routes[request.route],
      settings: elder.settings,
      helpers: elder.helpers,
    });
    requests.push(request);
  }
  return requests;
}

export function makeServerLookupObject(allRequests: AllRequests): ServerLookupObject {
  const lookup = {};
  for (const request of allRequests) {
    lookup[request.permalink] = request;
  }
  return lookup;
}

function displayElderPerfTimings(msg: string, elder: Pick<Elder, 'perf'> & { settings: { debug: DebugOptions } }) {
  const t = elder.perf.timings.slice(-1)[0] && Math.round(elder.perf.timings.slice(-1)[0].duration * 10) / 10;
  if (t && t > 0) {
    console.log(`${msg}: ${t}ms. ${t > 5000 ? `For details set debug.performance: true in elder.config.js` : ''}`);
    if (elder.settings.debug.performance) {
      displayPerfTimings([...elder.perf.timings]);
    }
  }
}

export { Elder, build, partialHydration };
