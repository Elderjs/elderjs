import { hookInterface } from '../hooks/hookInterface.js';

import build from '../build/build.js';
import partialHydration from '../partialHydration/partialHydration.js';

import { prepareServer, validateShortcode, permalinks, getConfig, prepareInlineShortcode } from '../utils/index.js';
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
import bundle from './bundle.js';
import bootstrap from './bootstrap.js';
import configureWatcher from './configureWatcher.js';

class Elder {
  bootstrapComplete: Promise<Elder>;

  markBootstrapComplete: (e: Elder | PromiseLike<Elder>) => void;

  settingsComplete: Promise<SettingsOptions>;

  markSettingsComplete: (e: SettingsOptions | PromiseLike<SettingsOptions>) => void;

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
    this.bootstrapComplete = new Promise((resolve) => {
      this.markBootstrapComplete = resolve;
    });

    this.settingsComplete = new Promise((resolve) => {
      this.markSettingsComplete = resolve;
    });

    this.uid = 'startup';

    // merge the given config with the project and defaults;
    this.settings = getConfig(initializationOptions);

    this.markSettingsComplete(this.settings);

    if (this.settings.context === 'server') {
      this.server = prepareServer({ bootstrapComplete: this.bootstrapComplete });
    }

    perf(this, true);

    bundle(this.settings).then(() => {
      bootstrap(this).catch((error) => {
        console.error(error);
        this.settings.$$internal.status = 'errored';
        console.log(`Awaiting change to try and recover. \n\n\n`);
      });
    });

    configureWatcher(this);
  }

  bootstrap() {
    return this.bootstrapComplete;
  }

  getSettings() {
    return this.settingsComplete;
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
    return hooks.filter((h) => !disable.includes(h.name));
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

export function displayElderPerfTimings(
  msg: string,
  elder: Pick<Elder, 'perf'> & { settings: { debug: DebugOptions } },
) {
  const t = elder.perf.timings.slice(-1)[0] && Math.round(elder.perf.timings.slice(-1)[0].duration * 10) / 10;
  if (t && t > 0) {
    console.log(`${msg}: ${t}ms. ${t > 5000 ? `For details set debug.performance: true in elder.config.js` : ''}`);
    if (elder.settings.debug.performance) {
      displayPerfTimings([...elder.perf.timings]);
    }
  }
}

export { Elder, build, partialHydration };
