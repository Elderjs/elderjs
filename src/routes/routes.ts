import glob from 'fast-glob';
import kebabcase from 'lodash.kebabcase';
import { parse as toRegExp } from 'regexparam';
import path from 'path';

import { svelteComponent } from '../utils/index.js';
import { SettingsOptions } from '../utils/types.js';
import wrapPermalinkFn from '../utils/wrapPermalinkFn.js';
import windowsPathFix from '../utils/windowsPathFix.js';
import makeDynamicPermalinkFn from './makeDynamicPermalinkFn.js';
import { ProcessedRouteOptions, RouteOptions, ProcessedRoutesObject } from './types.js';

const requireFile = async (file: string) => {
  const dataReq = await import(file);
  return dataReq.default || dataReq;
};

async function prepareRoutes(settings: SettingsOptions): Promise<ProcessedRoutesObject> {
  try {
    const { ssrComponents: ssrFolder, serverPrefix = '' } = settings.$$internal;

    const files = glob.sync(`${settings.srcDir}/routes/*/+(*.js|*.svelte)`).map((p) => windowsPathFix(p));
    const routejsFiles: string[] = files.filter((f) => f.endsWith('/route.js'));

    const routes: ProcessedRoutesObject = {};

    /**
     * Set Defaults in Route.js files
     * Add them to the 'routes' object
     */

    for (const routeFile of routejsFiles) {
      const routeName = routeFile.replace('/route.js', '').split('/').pop();
      const route: RouteOptions = await requireFile(routeFile);
      route.$$meta = {
        type: 'file',
        addedBy: routeFile,
      };

      const filesForThisRoute = files
        .filter((r) => r.includes(`/routes/${routeName}`))
        .filter((r) => !r.includes('route.js'));

      if (!route.name) {
        route.name = routeName;
      }

      // handle string based permalinks
      if (typeof route.permalink === 'string') {
        const routeString = `${serverPrefix}${route.permalink}`;
        route.permalink = makeDynamicPermalinkFn(route.permalink);

        route.$$meta = {
          ...route.$$meta,
          routeString,
          ...toRegExp(routeString),
          type: route.dynamic ? `dynamic` : 'static',
        };
      }

      // set default permalink if it doesn't exist.
      if (!route.permalink) {
        route.permalink = ({ request }) => (request.slug === '/' ? request.slug : `/${request.slug}/`);
      }
      route.permalink = wrapPermalinkFn({ permalinkFn: route.permalink, routeName, settings });

      // set default all()
      if (!Array.isArray(route.all) && typeof route.all !== 'function') {
        if (routeName.toLowerCase() === 'home') {
          route.all = [{ slug: '/' }];
        } else {
          route.all = [{ slug: kebabcase(routeName) }];
        }
      }

      // set default data as it is optional.
      if (!route.data) {
        route.data = {};
      }

      // find svelte template or set default
      if (!route.template) {
        const defaultLocation = path.resolve(settings.srcDir, `./routes/${routeName}/${routeName}.svelte`);
        const svelteFile = filesForThisRoute.find((f) =>
          f.toLowerCase().endsWith(windowsPathFix(defaultLocation.toLowerCase())),
        );
        if (!svelteFile) {
          console.error(
            `No template for route named "${routeName}". Expected to find it at: ${path.resolve(
              settings.srcDir,
              defaultLocation,
            )}. If you are using a different template please define it in your route.js file.`,
          );
        }

        route.template = defaultLocation;
      }

      // set default layout
      if (!route.layout) {
        route.layout = `Layout.svelte`;
      }

      routes[routeName] = route as ProcessedRouteOptions;
    }

    const ssrComponents = glob.sync(`${ssrFolder}/**/*.js`).map((p) => windowsPathFix(p));
    Object.keys(routes).forEach((routeName) => {
      const ssrTemplate = ssrComponents.find((f) => {
        const suffix = routes[routeName].template
          .toLowerCase()
          .replace('.svelte', '.js')
          .replace(settings.srcDir.toLowerCase(), '');
        return f.toLowerCase().endsWith(windowsPathFix(suffix));
      });
      if (!ssrTemplate) {
        console.error(
          `No SSR template found for ${routeName}. Expected at ${routes[routeName].template.replace(
            '.svelte',
            '.js',
          )}. Make sure rollup finished running.`,
        );
      }

      const ssrLayout = ssrComponents.find((f) => {
        const suffix = routes[routeName].layout
          .toLowerCase()
          .replace('.svelte', '.js')
          .replace(settings.srcDir.toLowerCase(), '');
        return f.toLowerCase().endsWith(windowsPathFix(suffix));
      });
      if (!ssrLayout) {
        console.error(
          `No SSR Layout found for ${routeName}. Expected at ${routes[routeName].layout.replace(
            '.svelte',
            '.js',
          )}. Make sure rollup finished running.`,
        );
      }

      routes[routeName].templateComponent = svelteComponent(routes[routeName].template, 'routes');
      routes[routeName].layoutComponent = svelteComponent(routes[routeName].layout, 'layouts');
    });

    return routes;
  } catch (e) {
    console.error(e);
    return {};
  }
}

export default prepareRoutes;
