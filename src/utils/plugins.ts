import fs from 'fs-extra';
import defaultsDeep from 'lodash.defaultsdeep';

import path from 'path';
import { validatePlugin, validateHook, svelteComponent } from '.';
import { HookOptions, ShortcodeDefs, PluginOptions } from '..';
import { Elder } from '../Elder';
import { RoutesOptions } from '../routes/types';
import createReadOnlyProxy from './createReadOnlyProxy';

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

    const validatedPlugin = validatePlugin(plugin);

    if (validatedPlugin) {
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
            const ssrComponent = path.resolve(elder.settings.$$internal.ssrComponents, `${templateName}.js`);

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
          shortcode.plugin = sanitizedPlugin;
          pluginShortcodes.push(shortcode);
        });
      }
    }
  }

  return { pluginRoutes, pluginHooks, pluginShortcodes };
}

export default plugins;
