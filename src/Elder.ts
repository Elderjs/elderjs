/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import path from 'path';
import fs from 'fs-extra';
import defaultsDeep from 'lodash.defaultsdeep';

import routes from './routes/routes';
import { hookInterface } from './hookInterface/hookInterface';
import internalHooks from './hooks';
import build from './build/build';
import partialHydration from './partialHydration/partialHydration';

import {
  svelteComponent,
  prepareRunHook,
  prepareServer,
  validateHook,
  validateRoute,
  validatePlugin,
  validateShortcode,
  permalinks,
  asyncForEach,
  getHashedSvelteComponents,
  getConfig,
} from './utils';
import { RoutesOptions } from './routes/types';
import { HookOptions } from './hookInterface/types';
import {
  ConfigOptions,
  SettingOptions,
  QueryOptions,
  RequestOptions,
  RequestsOptions,
  PluginOptions,
  ExcludesFalse,
  ShortcodeDefs,
} from './utils/types';
import createReadOnlyProxy from './utils/createReadOnlyProxy';
import workerBuild from './workerBuild';
import { inlineSvelteComponent } from './partialHydration/inlineSvelteComponent';
import elderJsShortcodes from './shortcodes';

const getElderConfig = getConfig;

class Elder {
  bootstrapComplete: Promise<any>;

  markBootstrapComplete: (Object) => void;

  settings: ConfigOptions & SettingOptions;

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

  constructor({ context, worker = false }) {
    this.bootstrapComplete = new Promise((resolve) => {
      this.markBootstrapComplete = resolve;
    });

    const config = getConfig(context);

    this.settings = {
      ...config,
      server: context === 'server' && config[context],
      build: context === 'build' && config[context],
      $$internal: {
        hashedComponents: getHashedSvelteComponents(config),
      },
    };

    if (context === 'build' && worker) {
      this.settings.worker = worker;
    }

    if (!context || context === 'build') {
      this.settings.debug.automagic = false;
    }

    /**
     * Plugin initalization
     * * Collect plugin routes
     * * Add plugin object and helpers to all plugin hook functions.
     */
    let pluginRoutes: RoutesOptions = {};
    const pluginHooks: Array<HookOptions> = [];
    const pluginShortcodes: ShortcodeDefs = [];
    const pluginNames = Object.keys(this.settings.plugins);

    for (let i = 0; i < pluginNames.length; i += 1) {
      const pluginName = pluginNames[i];

      const pluginConfigFromConfig = this.settings.plugins[pluginName];

      let plugin: PluginOptions | undefined;
      const pluginPath = `./plugins/${pluginName}/index.js`;
      const srcPlugin = path.resolve(this.settings.srcDir, pluginPath);
      if (fs.existsSync(srcPlugin)) {
        // eslint-disable-next-line import/no-dynamic-require
        const pluginReq = require(srcPlugin);
        plugin = pluginReq.default || pluginReq;
      }

      if (!plugin) {
        const pkgPath = path.resolve(this.settings.paths.rootDir, './node_modules/', pluginName);
        if (fs.existsSync(pkgPath)) {
          // eslint-disable-next-line import/no-dynamic-require
          const pluginPackageJson = require(path.resolve(pkgPath, './package.json'));
          const pluginPkgPath = path.resolve(pkgPath, pluginPackageJson.main);

          // eslint-disable-next-line import/no-dynamic-require
          plugin = require(pluginPkgPath).default || require(pluginPkgPath);
        }
      }

      if (!plugin) {
        throw new Error(`Plugin ${pluginName} not found in plugins or node_modules folder.`);
      }

      plugin =
        plugin.init({
          ...plugin,
          config: defaultsDeep(pluginConfigFromConfig, plugin.config),
          settings: createReadOnlyProxy(this.settings, 'Settings', 'plugin init()'),
        }) || plugin;

      const validatedPlugin = validatePlugin(plugin);
      if (!validatedPlugin) return;
      plugin = validatedPlugin;

      // clean props the plugin shouldn't be able to change between hook... specifically their hooks;
      let { hooks: pluginHooksArray } = plugin;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { init, ...sanitizedPlugin } = plugin;

      pluginHooksArray = pluginHooksArray.map(
        (hook): HookOptions => {
          return {
            ...hook,
            $$meta: {
              type: 'plugin',
              addedBy: pluginName,
            },
            run: async (payload: any = {}) => {
              // pass the plugin definition into the closure of every hook.
              let pluginDefinition = sanitizedPlugin;

              // eslint-disable-next-line no-param-reassign
              payload.plugin = pluginDefinition;

              const pluginResp = await hook.run(payload);
              if (pluginResp) {
                if (pluginResp.plugin) {
                  const { plugin: newPluginDef, ...rest } = pluginResp;
                  // while objects are pass by reference, the pattern we encourage is to return the mutation of state.
                  // if users followed this pattern for plugins, we may not be mutating the plugin definition, so this is added.
                  pluginDefinition = newPluginDef;
                  return rest;
                }
                return pluginResp;
              }

              // make sure something is returned
              return {};
            },
          };
        },
      );

      pluginHooksArray.forEach((hook) => {
        const validatedHook = validateHook(hook);
        if (validatedHook) {
          pluginHooks.push(validatedHook);
        }
      });

      if (Object.hasOwnProperty.call(plugin, 'routes')) {
        const routeNames = Object.keys(plugin.routes);
        // eslint-disable-next-line no-loop-func
        routeNames.forEach((routeName) => {
          // don't allow plugins to add hooks via the routes definitions like users can.
          if (plugin.routes[routeName].hooks)
            console.error(
              `WARN: Plugin ${routeName} is trying to register a hooks via a the 'hooks' array on a route. This is not supported. Plugins must define the 'hooks' array at the plugin level.`,
            );
          if (!plugin.routes[routeName].data) {
            plugin.routes[routeName].data = () => ({});
          }

          if (
            typeof plugin.routes[routeName].template === 'string' &&
            plugin.routes[routeName].template.endsWith('.svelte')
          ) {
            const templateName = plugin.routes[routeName].template.replace('.svelte', '');
            const ssrComponent = path.resolve(this.settings.paths.ssrComponents, `${templateName}.js`);

            if (!fs.existsSync(ssrComponent)) {
              console.warn(
                `Plugin Route: ${routeName} has an error. No SSR svelte component found ${templateName} which was added by ${pluginName}. This may cause unexpected outcomes. If you believe this should be working, make sure rollup has run before this file is initialized. If the issue persists, please contact the plugin author. Expected location \`${ssrComponent}\``,
              );
            }

            plugin.routes[routeName].templateComponent = svelteComponent(templateName);
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hooks: pluginRouteHooks, ...sanitizedRouteDeets } = plugin.routes[routeName];
          const sanitizedRoute = {};
          sanitizedRoute[routeName] = { ...sanitizedRouteDeets, $$meta: { type: 'plugin', addedBy: pluginName } };

          pluginRoutes = { ...pluginRoutes, ...sanitizedRoute };
        });
      }

      if (plugin.shortcodes && plugin.shortcodes.length > 0) {
        plugin.shortcodes.forEach((shortcode) => {
          shortcode.$$meta = {
            type: 'plugin',
            addedBy: pluginName,
          };
          pluginShortcodes.push(shortcode);
        });
      }
    }

    /**
     * Finalize Routes
     * Add in user routes
     * Add in plugin routes
     * Validate them
     */

    // add meta to routes and collect hooks from routes
    const userRoutesJsFile = routes(this.settings);

    const userRoutes = Object.keys(userRoutesJsFile);

    userRoutes.forEach((routeName) => {
      userRoutesJsFile[routeName] = {
        ...userRoutesJsFile[routeName],
        $$meta: {
          type: 'route',
          addedBy: 'routejs',
        },
      };
    });

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
      .filter((Boolean as any) as ExcludesFalse);

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
        console.error(`Could not load hooks file from ${shortcodeSrcPath}.`);
      } else {
        console.error(err);
      }
    }

    // validate shortcodes
    this.shortcodes = [...elderJsShortcodes, ...pluginShortcodes, ...shortcodesJs]
      .map((shortcode) => validateShortcode(shortcode))
      .filter((Boolean as any) as ExcludesFalse);

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
    };

    if (context === 'server') {
      this.server = prepareServer({ bootstrapComplete: this.bootstrapComplete });
    }

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
      await asyncForEach(Object.keys(this.routes), async (routeName) => {
        const route = this.routes[routeName];
        let allRequestsForRoute = [];
        if (typeof route.all === 'function') {
          allRequestsForRoute = await route.all({
            settings: createReadOnlyProxy(this.settings, 'settings', `${routeName} all function`),
            query: createReadOnlyProxy(this.query, 'query', `${routeName} all function`),
            helpers: createReadOnlyProxy(this.helpers, 'helpers', `${routeName} all function`),
            data: createReadOnlyProxy(this.data, 'data', `${routeName} all function`),
          });
        } else if (Array.isArray(route.all)) {
          allRequestsForRoute = route.all;
        }

        if (!Array.isArray(allRequestsForRoute)) {
          throw new Error(`${routeName}'s all() function isn't returning an array`);
        }

        allRequestsForRoute.forEach((r) => {
          r.route = routeName;
          if (!{}.hasOwnProperty.call(r, 'slug')) {
            throw new Error(`Request for ${routeName} is missing a slug property.`);
          }
        });

        this.allRequests = this.allRequests.concat(allRequestsForRoute);
      });

      await this.runHook('allRequests', this);

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
        if (context === 'server') {
          request.type = 'server';
        } else if (context === 'build') {
          request.type = 'build';
        } else {
          request.type = 'unknown';
        }
        request.permalink = await this.routes[request.route].permalink({
          request,
          settings: { ...this.settings },
        });

        if (this.settings && this.settings.server && this.settings.server.prefix) {
          request.permalink = this.settings.server.prefix + request.permalink;
        }

        if (context === 'server') {
          this.serverLookupObject[request.permalink] = request;
        }
      });

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

      this.markBootstrapComplete(this);
    });
  }

  bootstrap() {
    return this.bootstrapComplete;
  }

  worker(workerRequests) {
    return workerBuild({ bootstrapComplete: this.bootstrapComplete, workerRequests });
  }
}

export { Elder, getElderConfig, build, partialHydration };
