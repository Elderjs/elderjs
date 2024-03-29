/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import path from 'path';

import routes from './routes/routes';
import plugins from './plugins';
import { hookInterface } from './hooks/hookInterface';
import internalHooks from './hooks';
import build from './build/build';
import partialHydration from './partialHydration/partialHydration';

import {
  prepareRunHook,
  prepareServer,
  validateHook,
  validateRoute,
  validateShortcode,
  permalinks,
  asyncForEach,
  getConfig,
  prepareInlineShortcode,
} from './utils';
import { RoutesOptions } from './routes/types';
import { HookOptions } from './hooks/types';
import { ShortcodeDefs } from './shortcodes/types';
import {
  SettingsOptions,
  QueryOptions,
  RequestOptions,
  RequestsOptions,
  ExcludesFalse,
  InitializationOptions,
} from './utils/types';
import createReadOnlyProxy from './utils/createReadOnlyProxy';
import workerBuild from './workerBuild';
import { inlineSvelteComponent } from './partialHydration/inlineSvelteComponent';
import elderJsShortcodes from './shortcodes';
import prepareRouter from './routes/prepareRouter';
import perf, { displayPerfTimings } from './utils/perf';

class Elder {
  bootstrapComplete: Promise<any>;

  markBootstrapComplete: (Object) => void;

  settings: SettingsOptions;

  routes: RoutesOptions;

  hooks: Array<HookOptions>;

  data: Object;

  runHook: (string, Object) => Promise<any>;

  query: QueryOptions;

  allRequests: Array<RequestOptions>;

  serverLookupObject: RequestsOptions;

  errors: any[];

  helpers: {};

  server: any;

  builder: any;

  hookInterface: any;

  shortcodes: ShortcodeDefs;

  perf: any;

  uid: string;

  router: (any) => any;

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

    if (this.settings.context === 'build') {
      this.settings.debug.automagic = false;
    }

    if (this.settings.context === 'server') {
      this.server = prepareServer({ bootstrapComplete: this.bootstrapComplete });
    }

    perf(this, true);

    this.perf.start('startup');

    // plugins are run first as they have routes, hooks, and shortcodes.
    plugins(this).then(async ({ pluginRoutes, pluginHooks, pluginShortcodes }) => {
      this.perf.start('startup.validations');
      /**
       * Finalize Routes
       * Add in user routes
       * Add in plugin routes
       * Validate them
       */

      // add meta to routes and collect hooks from routes
      const userRoutesJsFile = routes(this.settings);

      // plugins should never overwrite user routes.
      const collectedRoutes: RoutesOptions = { ...pluginRoutes, ...userRoutesJsFile };
      const validatedRoutes = {};
      const collectedRouteNames = Object.keys(collectedRoutes);
      collectedRouteNames.forEach((collectedRouteName) => {
        const collectedRoute = collectedRoutes[collectedRouteName];

        const validated = validateRoute(collectedRoute, collectedRouteName);
        if (validated) {
          validatedRoutes[collectedRouteName] = validated;
        }
      });

      this.routes = validatedRoutes;

      /**
       * Finalize hooks
       * Import User Hooks.js
       * Validate Hooks
       * Filter out hooks that are disabled.
       */

      let hooksJs: Array<HookOptions> = [];
      const hookSrcPath = path.resolve(this.settings.srcDir, './hooks.js');

      try {
        const hooksReq = require(hookSrcPath);
        const hookSrcFile: Array<HookOptions> = hooksReq.default || hooksReq;
        hooksJs = hookSrcFile.map((hook) => ({
          ...hook,
          $$meta: {
            type: 'hooks.js',
            addedBy: 'hooks.js',
          },
        }));
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          console.error(`Could not load hooks file from ${hookSrcPath}.`);
        } else {
          console.error(err);
        }
      }

      // validate hooks
      const elderJsHooks: Array<HookOptions> = internalHooks.map((hook) => ({
        ...hook,
        $$meta: {
          type: 'internal',
          addedBy: 'elder.js',
        },
      }));

      // validate hooks
      this.hooks = [...elderJsHooks, ...pluginHooks, ...hooksJs]
        .map((hook) => validateHook(hook))
        .filter(Boolean as any as ExcludesFalse);

      if (this.settings.hooks.disable && this.settings.hooks.disable.length > 0) {
        this.hooks = this.hooks.filter((h) => !this.settings.hooks.disable.includes(h.name));
      }

      /**
       * Finalize Shortcodes
       * Import User Shortcodes.js
       * Validate Shortcodes
       */

      let shortcodesJs: ShortcodeDefs = [];
      const shortcodeSrcPath = path.resolve(this.settings.srcDir, './shortcodes.js');

      try {
        const shortcodeReq = require(shortcodeSrcPath);
        const shortcodes: ShortcodeDefs = shortcodeReq.default || shortcodeReq;
        shortcodesJs = shortcodes.map((shortcode) => ({
          ...shortcode,
          $$meta: {
            type: 'shortcodes.js',
            addedBy: 'shortcodes.js',
          },
        }));
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          console.error(
            `Could not load shortcodes file from ${shortcodeSrcPath}. They are not required, but could be useful.`,
          );
        } else {
          console.error(err);
        }
      }

      // validate shortcodes
      this.shortcodes = [...elderJsShortcodes, ...pluginShortcodes, ...shortcodesJs]
        .map((shortcode) => validateShortcode(shortcode))
        .filter(Boolean as any as ExcludesFalse);

      this.perf.end('startup.validations');

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

      this.helpers = {
        permalinks: permalinks({ routes: this.routes, settings: this.settings }),
        inlineSvelteComponent,
        shortcode: prepareInlineShortcode({ settings: this.settings }),
      };

      // customizeHooks should not be used by plugins. Plugins should use their own closure to manage data and be side effect free.
      const hooksMinusPlugins = this.hooks.filter((h) => h.$$meta.type !== 'plugin');
      this.runHook = prepareRunHook({
        hooks: hooksMinusPlugins,
        allSupportedHooks: hookInterface,
        settings: this.settings,
      });

      this.runHook('customizeHooks', this).then(async () => {
        // we now have any customizations to the hookInterface.
        // we need to rebuild runHook with these customizations.
        this.runHook = prepareRunHook({
          hooks: this.hooks,
          allSupportedHooks: hookInterface,
          settings: this.settings,
        });

        await this.runHook('bootstrap', this);

        // collect all of our requests
        this.perf.start('startup.routes');
        await asyncForEach(Object.keys(this.routes), async (routeName) => {
          this.perf.start(`startup.routes.${routeName}`);
          const route = this.routes[routeName];
          let allRequestsForRoute = [];
          if (typeof route.all === 'function') {
            this.perf.start(`startup.routes.${routeName}.all`);
            allRequestsForRoute = await route.all({
              settings: createReadOnlyProxy(this.settings, 'settings', `${routeName} all function`),
              query: createReadOnlyProxy(this.query, 'query', `${routeName} all function`),
              helpers: createReadOnlyProxy(this.helpers, 'helpers', `${routeName} all function`),
              data: createReadOnlyProxy(this.data, 'data', `${routeName} all function`),
              perf: this.perf.prefix(`startup.routes.${routeName}.all`),
            });
            this.perf.end(`startup.routes.${routeName}.all`);
          } else if (Array.isArray(route.all)) {
            allRequestsForRoute = route.all;
          }

          if (!Array.isArray(allRequestsForRoute)) {
            throw new Error(`${routeName}'s all() function isn't returning an array`);
          }

          allRequestsForRoute = allRequestsForRoute.reduce((out, cv) => {
            // copy the obj so we don't have pass by reference issues.
            const copy = JSON.parse(JSON.stringify(cv));
            // add in routeName
            copy.route = routeName;
            out.push(copy);
            return out;
          }, []);
          this.allRequests = this.allRequests.concat(allRequestsForRoute);
          this.perf.end(`startup.routes.${routeName}`);
        });

        this.perf.end(`startup.routes`);

        await this.runHook('allRequests', this);

        this.perf.start(`startup.setPermalinks`);
        await asyncForEach(this.allRequests, async (request) => {
          if (!this.routes[request.route] || !this.routes[request.route].permalink) {
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

          request.type = this.settings.context;

          request.permalink = await this.routes[request.route].permalink({
            request,
            settings: createReadOnlyProxy(this.settings, 'settings', `${request.route} permalink function`),
            helpers: createReadOnlyProxy(this.helpers, 'helpers', `${request.route} permalink function`),
          });

          if (this.settings.context === 'server') {
            this.serverLookupObject[request.permalink] = request;
          }
        });
        this.perf.end(`startup.setPermalinks`);

        this.perf.start(`startup.validatePermalinks`);

        if (this.allRequests.length !== new Set(this.allRequests.map((r) => r.permalink)).size) {
          // useful error logging for when there are duplicate permalinks.
          for (let i = 0, l = this.allRequests.length; i < l; i += 1) {
            for (let ii = 0, li = this.allRequests.length; ii < li; ii += 1) {
              if (i !== ii && this.allRequests[i].permalink === this.allRequests[ii].permalink) {
                throw new Error(
                  `Duplicate permalinks detected. Here are the relevant requests: ${JSON.stringify(
                    this.allRequests[i],
                  )} and ${JSON.stringify(this.allRequests[ii])}`,
                );
              }
            }
          }
        }
        this.perf.end(`startup.validatePermalinks`);

        this.perf.start(`startup.prepareRouter`);
        this.router = prepareRouter(this);
        this.perf.end(`startup.prepareRouter`);

        this.perf.end('startup');
        this.perf.stop();

        const t = this.perf.timings.slice(-1)[0] && Math.round(this.perf.timings.slice(-1)[0].duration * 10) / 10;
        if (t && t > 0) {
          console.log(
            `Elder.js Startup: ${t}ms. ${t > 5000 ? `For details set debug.performance: true in elder.config.js` : ''}`,
          );
          if (this.settings.debug.performance) {
            displayPerfTimings([...this.perf.timings]);
          }
        }

        this.markBootstrapComplete(this);
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

export { Elder, build, partialHydration };
