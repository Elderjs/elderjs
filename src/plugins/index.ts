/* eslint-disable no-param-reassign */
/* eslint-disable global-require */
import fs from 'fs-extra';
import defaultsDeep from 'lodash.defaultsdeep';

import path from 'path';
import toRegExp from 'regexparam';

import { ShortcodeDefs } from '../shortcodes/types';
import { validatePlugin, validateHook, svelteComponent, HookOptions, PluginOptions } from '..';
import { Elder } from '../Elder';
import { RoutesOptions } from '../routes/types';
import createReadOnlyProxy from '../utils/createReadOnlyProxy';
import wrapPermalinkFn from '../utils/wrapPermalinkFn';
import makeDynamicPermalinkFn from '../routes/makeDynamicPermalinkFn';

export const pluginVersionCheck = (elderVersion: string, pluginVersion: string): boolean => {
  const eSplit = elderVersion.split('.');
  const eMajor = Number(eSplit[0]);
  const eMinor = Number(eSplit[1]);
  const ePatch = Number(eSplit[2]);

  const pSplit = pluginVersion.split('.');
  const pMajor = Number(pSplit[0]);
  const pMinor = Number(pSplit[1]);
  const pPatch = Number(pSplit[2]);

  let enabled = false;

  if (eMajor > pMajor) enabled = true;
  if (eMajor === pMajor && eMinor > pMinor) enabled = true;
  if (eMajor === pMajor && eMinor === pMinor && ePatch >= pPatch) enabled = true;

  return enabled;
};

async function plugins(elder: Elder) {
  /**
   * Plugin initialization
   * * Collect plugin routes
   * * Add plugin object and helpers to all plugin hook functions.
   */
  let pluginRoutes: RoutesOptions = {};
  const pluginHooks: Array<HookOptions> = [];
  const pluginShortcodes: ShortcodeDefs = [];

  const pluginNames = Object.keys(elder.settings.plugins);

  for (let i = 0; i < pluginNames.length; i += 1) {
    let usesNodeModulesFolder = false;
    const pluginName = pluginNames[i];

    const pluginConfigFromConfig = elder.settings.plugins[pluginName];

    let plugin: PluginOptions | undefined;
    const pluginPath = `./plugins/${pluginName}/index.js`;
    const srcPlugin = path.resolve(elder.settings.srcDir, pluginPath);

    if (fs.existsSync(srcPlugin)) {
      // eslint-disable-next-line import/no-dynamic-require
      const pluginReq = require(srcPlugin);
      plugin = pluginReq.default || pluginReq;
    }

    if (!plugin) {
      const pkgPath = path.resolve(elder.settings.rootDir, './node_modules/', pluginName);
      if (fs.existsSync(pkgPath)) {
        usesNodeModulesFolder = true;
        // eslint-disable-next-line import/no-dynamic-require
        const pluginPackageJson = require(path.resolve(pkgPath, './package.json'));
        const pluginPkgPath = path.resolve(pkgPath, pluginPackageJson.main);

        // eslint-disable-next-line import/no-dynamic-require
        const nmPluginReq = require(pluginPkgPath);
        plugin = nmPluginReq.default || nmPluginReq;
      }
    }

    if (!plugin) {
      console.error(new Error(`Plugin ${pluginName} not found in plugins or node_modules folder. Skipping.`));
      // eslint-disable-next-line no-continue
      continue;
    }

    if (typeof plugin.init === 'function' || (plugin.init && typeof plugin.init.then === 'function')) {
      plugin =
        // eslint-disable-next-line no-await-in-loop
        (await plugin.init({
          ...plugin,
          config: defaultsDeep(pluginConfigFromConfig, plugin.config),
          settings: createReadOnlyProxy(elder.settings, 'Settings', 'plugin init()'),
        })) || plugin;
    }

    if (plugin.minimumElderjsVersion) {
      if (plugin.minimumElderjsVersion.split('.').length !== 3)
        console.error(
          `${pluginName} has a malformed minimumElderjsVersion of ${plugin.minimumElderjsVersion}. Please tell the developer to update.`,
        );
      if (!pluginVersionCheck(elder.settings.version, plugin.minimumElderjsVersion)) {
        console.error(
          Error(
            `Plugin ${pluginName} requires Elder.js version ${plugin.minimumElderjsVersion} and you are using ${elder.settings.version}. Disabling plugin. If you want to use this plugin, please update to the required version.`,
          ),
        );
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    const validatedPlugin = validatePlugin(plugin);

    if (validatedPlugin) {
      plugin = validatedPlugin;

      // clean props the plugin shouldn't be able to change between hook... specifically their hooks;
      let { hooks: pluginHooksArray } = plugin;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { init, ...sanitizedPlugin } = plugin;

      pluginHooksArray = pluginHooksArray.map((hook): HookOptions => {
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
      });

      pluginHooksArray.forEach((hook) => {
        const validatedHook = validateHook(hook);
        if (validatedHook) {
          pluginHooks.push(validatedHook);
        }
      });

      if (Object.hasOwnProperty.call(plugin, 'routes')) {
        const routeNames = Object.keys(plugin.routes);
        // eslint-disable-next-line no-loop-func
        for (let ii = 0; ii < routeNames.length; ii += 1) {
          const routeName = routeNames[ii];

          plugin.routes[routeName].$$meta = {
            type: 'plugin',
            addedBy: routeName,
          };

          if (typeof plugin.routes[routeName].permalink === 'undefined') {
            console.error(
              `WARN: Plugin ${routeName} does not define a permalink function on it's routes. Setting default permalink to \`/${routeName}/\``,
            );
            plugin.routes[routeName].permalink = () => `/${routeName}/`;
          }

          const { serverPrefix } = elder.settings.$$internal;

          // handle string based permalinks
          if (typeof plugin.routes[routeName].permalink === 'string') {
            const routeString = `${serverPrefix}${plugin.routes[routeName].permalink}`;
            plugin.routes[routeName].permalink = makeDynamicPermalinkFn(plugin.routes[routeName].permalink);

            plugin.routes[routeName].$$meta = {
              ...plugin.routes[routeName].$$meta,
              routeString,
              ...toRegExp.parse(routeString),
              type: plugin.routes[routeName].dynamic ? `dynamic` : 'static',
            };
          }

          plugin.routes[routeName].permalink = wrapPermalinkFn({
            permalinkFn: plugin.routes[routeName].permalink,
            routeName,
            settings: elder.settings,
          });

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
            const ssrComponent = path.resolve(
              elder.settings.$$internal.ssrComponents,
              `./${usesNodeModulesFolder ? 'node_modules/' : 'plugins/'}${pluginName}/${templateName}.js`,
            );

            const template = elder.settings.$$internal.findComponent(
              templateName,
              usesNodeModulesFolder ? 'node_modules' : 'plugins',
            );

            if (!template.ssr && !fs.existsSync(ssrComponent)) {
              console.warn(
                `Plugin Route: ${routeName} added by plugin ${pluginName} has an error. No SSR svelte component found ${templateName}. This may cause unexpected outcomes. If you believe this should be working, make sure rollup has run before this file is initialized. If the issue persists, please contact the plugin author. Expected location \`${ssrComponent}\``,
              );
            }

            plugin.routes[routeName].templateComponent = svelteComponent(
              templateName,
              usesNodeModulesFolder ? 'node_modules' : 'plugins',
            );
          } else {
            console.error(
              Error(
                `Plugin Route: ${routeName} added by plugin ${pluginName} does not have a template defined. Disabling this route.`,
              ),
            );
            // eslint-disable-next-line no-continue
            continue;
          }

          if (
            typeof plugin.routes[routeName].layout === 'string' &&
            plugin.routes[routeName].layout.endsWith('.svelte')
          ) {
            const layoutName = plugin.routes[routeName].layout.replace('.svelte', '');
            const ssrComponent = path.resolve(
              elder.settings.$$internal.ssrComponents,
              `./plugins/${pluginName}/${layoutName}.js`,
            );

            const layout = elder.settings.$$internal.findComponent(
              layoutName,
              usesNodeModulesFolder ? 'node_modules' : 'plugins',
            );

            if (!layout.ssr && !fs.existsSync(ssrComponent)) {
              console.warn(
                `Plugin Route: ${routeName} added by plugin ${pluginName} has an error. No SSR svelte component found ${layoutName}. This may cause unexpected outcomes. If you believe this should be working, make sure rollup has run before this file is initialized. If the issue persists, please contact the plugin author. Expected location \`${ssrComponent}\``,
              );
            }
            plugin.routes[routeName].layoutComponent = svelteComponent(
              layoutName,
              usesNodeModulesFolder ? 'node_modules' : 'plugins',
            );
          } else {
            plugin.routes[routeName].layout = 'Layout.svelte';
            const ssrComponent = path.resolve(elder.settings.$$internal.ssrComponents, `./layouts/Layout.js`);

            if (!fs.existsSync(ssrComponent)) {
              console.error(
                `Plugin Route: ${routeName} added by plugin ${pluginName} requires a /src/layouts/Layout.svelte to be compiled at ${ssrComponent}. Disabling this route.`,
              );
              // eslint-disable-next-line no-continue
              continue;
            }
            plugin.routes[routeName].layoutComponent = svelteComponent('Layout.svelte', 'layouts');
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hooks: pluginRouteHooks, ...sanitizedRouteDeets } = plugin.routes[routeName];
          const sanitizedRoute = {};
          sanitizedRoute[routeName] = { ...sanitizedRouteDeets, $$meta: { type: 'plugin', addedBy: pluginName } };

          pluginRoutes = { ...pluginRoutes, ...sanitizedRoute };
        }
      }

      if (plugin.shortcodes && plugin.shortcodes.length > 0) {
        plugin.shortcodes.forEach((shortcode) => {
          shortcode.$$meta = {
            type: 'plugin',
            addedBy: pluginName,
          };
          shortcode.plugin = sanitizedPlugin;
          pluginShortcodes.push(shortcode);
        });
      }
    }
  }

  return { pluginRoutes, pluginHooks, pluginShortcodes };
}

export default plugins;
