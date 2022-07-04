import fs from 'fs-extra';
import defaultsDeep from 'lodash.defaultsdeep';
import path from 'path';
import { parse as toRegExp } from 'regexparam';

import { ShortcodeDefinitions } from '../shortcodes/types.js';

import { Elder } from '../core/Elder.js';
import { ProcessedRouteOptions, ProcessedRoutesObject } from '../routes/types.js';
import createReadOnlyProxy from '../utils/createReadOnlyProxy.js';
import wrapPermalinkFn from '../utils/wrapPermalinkFn.js';
import makeDynamicPermalinkFn from '../routes/makeDynamicPermalinkFn.js';
import { validateHook, validatePlugin, validateRoute, validateShortcode } from '../utils/validations.js';
import svelteComponent from '../partialHydration/svelteComponent.js';
import { ProcessedHooksArray, TProcessedHook } from '../hooks/types.js';
import { ExcludesFalse } from '../index.js';
import { PluginOptions } from './types.js';

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
  elder.perf.start('startup.plugins');
  /**
   * Plugin initialization
   * * Collect plugin routes
   * * Add plugin object and helpers to all plugin hook functions.
   */
  let pluginRoutes: ProcessedRoutesObject = {};
  const pluginHooks: ProcessedHooksArray = [];
  const pluginShortcodes: ShortcodeDefinitions = [];

  const pluginNames = Object.keys(elder.settings.plugins);

  for (let i = 0; i < pluginNames.length; i += 1) {
    let usesNodeModulesFolder = false;
    const pluginName = pluginNames[i];

    elder.perf.start(`startup.plugins.${pluginName}`);

    const pluginConfigFromConfig = elder.settings.plugins[pluginName];

    let plugin: PluginOptions | undefined;
    const pluginPath = `./plugins/${pluginName}/index.js`;
    const srcPlugin = path.resolve(elder.settings.srcDir, pluginPath);

    if (fs.existsSync(srcPlugin)) {
      const pluginReq = await import(srcPlugin);
      plugin = pluginReq.default || pluginReq;
    }

    if (!plugin) {
      const pkgPath = path.resolve(elder.settings.rootDir, './node_modules/', pluginName);
      if (fs.existsSync(pkgPath)) {
        usesNodeModulesFolder = true;
        const pluginPackageJson = fs.readJsonSync(path.resolve(pkgPath, './package.json'));
        const pluginPkgPath = path.resolve(
          pkgPath,
          pluginPackageJson.main.startsWith('/') ? `.${pluginPackageJson.main}` : pluginPackageJson.main,
        );

        const nmPluginReq = await import(pluginPkgPath);
        plugin = nmPluginReq.default || nmPluginReq;
      }
    }

    if (!plugin) {
      console.error(new Error(`Plugin ${pluginName} not found in plugins or node_modules folder. Skipping.`));
      // eslint-disable-next-line no-continue
      continue;
    }

    if (typeof plugin.init === 'function') {
      elder.perf.start(`startup.plugins.${pluginName}.init`);
      plugin =
        // eslint-disable-next-line no-await-in-loop
        (await plugin.init({
          ...plugin,
          config: defaultsDeep(pluginConfigFromConfig, plugin.config),
          settings: createReadOnlyProxy(elder.settings, 'Settings', 'plugin init()'),
        })) || plugin;
      elder.perf.end(`startup.plugins.${pluginName}.init`);
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

      pluginHooksArray = pluginHooksArray
        .map((hook): TProcessedHook => {
          return {
            priority: 50,
            ...hook,
            $$meta: {
              type: 'plugin',
              addedBy: pluginName,
            },
            run: async (payload) => {
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
        })
        .map((hook) => validateHook(hook))
        .filter((v) => v)
        .filter(Boolean as any as ExcludesFalse); // ts hack to force it to realize this is only items that are true

      pluginHooksArray.forEach((hook) => {
        const validatedHook = validateHook(hook);
        if (validatedHook && validatedHook.hook !== 'customizeHooks') {
          if (validatedHook.priority >= 0 && validatedHook.priority <= 100) {
            pluginHooks.push({
              priority: 50,
              $$meta: {
                type: 'plugin',
                addedBy: pluginName,
              },
              ...validatedHook,
            });
          } else {
            console.log(`${pluginName}.${hook.name} has an invalid priority. Plugin hooks must be >= 0 or <= 100`);
          }
        }
      });

      if (Object.hasOwnProperty.call(plugin, 'routes')) {
        const routeNames = Object.keys(plugin.routes);
        // eslint-disable-next-line no-loop-func
        for (let ii = 0; ii < routeNames.length; ii += 1) {
          const routeName = routeNames[ii];
          const { permalink, ...restOfRoute } = plugin.routes[routeName];

          const processedRoute: Partial<ProcessedRouteOptions> = {
            ...restOfRoute,
            $$meta: {
              type: 'plugin',
              addedBy: routeName,
            },
          };

          if (typeof permalink === 'function') {
            processedRoute.permalink = permalink;
          } else if (typeof permalink === 'undefined') {
            console.error(
              `WARN: Plugin ${routeName} does not define a permalink function on it's routes. Setting default permalink to \`/${routeName}/\``,
            );
            processedRoute.permalink = () => `/${routeName}/`;
          } else if (typeof processedRoute.permalink === 'string') {
            // handle string based permalinks
            const { serverPrefix } = elder.settings.$$internal;
            const routeString = `${serverPrefix}${processedRoute.permalink}`;
            processedRoute.permalink = makeDynamicPermalinkFn(processedRoute.permalink);

            processedRoute.$$meta = {
              ...processedRoute.$$meta,
              routeString,
              ...toRegExp(routeString),
              type: processedRoute.dynamic ? `dynamic` : 'static',
            };
          }

          processedRoute.permalink = wrapPermalinkFn({
            permalinkFn: processedRoute.permalink,
            routeName,
            settings: elder.settings,
          });

          if (processedRoute.hooks)
            console.error(
              `WARN: Plugin ${routeName} is trying to register a hooks via a the 'hooks' array on a route. This is not supported. Plugins must define the 'hooks' array at the plugin level.`,
            );
          if (!processedRoute.data) {
            processedRoute.data = () => ({});
          }

          if (typeof processedRoute.template === 'string' && processedRoute.template.endsWith('.svelte')) {
            const templateName = processedRoute.template.replace('.svelte', '');
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

            processedRoute.templateComponent = svelteComponent(
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

          if (typeof processedRoute.layout === 'string' && processedRoute.layout.endsWith('.svelte')) {
            const layoutName = processedRoute.layout.replace('.svelte', '');
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
            processedRoute.layoutComponent = svelteComponent(
              layoutName,
              usesNodeModulesFolder ? 'node_modules' : 'plugins',
            );
          } else {
            processedRoute.layout = 'Layout.svelte';
            const ssrComponent = path.resolve(elder.settings.$$internal.ssrComponents, `./layouts/Layout.js`);

            if (!fs.existsSync(ssrComponent)) {
              console.error(
                `Plugin Route: ${routeName} added by plugin ${pluginName} requires a /src/layouts/Layout.svelte to be compiled at ${ssrComponent}. Disabling this route.`,
              );
              // eslint-disable-next-line no-continue
              continue;
            }
            processedRoute.layoutComponent = svelteComponent('Layout.svelte', 'layouts');
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars

          const sanitizedRouteDeets = processedRoute as ProcessedRouteOptions;
          if (validateRoute(sanitizedRouteDeets)) {
            const sanitizedRoute: ProcessedRoutesObject = {
              [routeName]: { ...sanitizedRouteDeets, $$meta: { type: 'plugin', addedBy: pluginName } },
            };
            pluginRoutes = { ...pluginRoutes, ...sanitizedRoute };
          }
        }
      }

      if (plugin.shortcodes && plugin.shortcodes.length > 0) {
        plugin.shortcodes
          .map(validateShortcode)
          .filter((v) => v)
          .filter(Boolean as any as ExcludesFalse) // ts hack to force it to realize this is only items that are true
          .forEach((shortcode) => {
            shortcode.$$meta = {
              type: 'plugin',
              addedBy: pluginName,
            };
            shortcode.plugin = sanitizedPlugin;
            pluginShortcodes.push(shortcode);
          });
      }
    }

    elder.perf.end(`startup.plugins.${pluginName}`);
  }
  elder.perf.end('startup.plugins');

  return { pluginRoutes, pluginHooks, pluginShortcodes };
}

export default plugins;
