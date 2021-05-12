/* eslint-disable no-cond-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import glob from 'glob';
import kebabcase from 'lodash.kebabcase';
import toRegExp from 'regexparam';
import path from 'path';
import fs from 'fs-extra';

import { svelteComponent } from '../utils';
import { SettingsOptions } from '../utils/types';
import wrapPermalinkFn from '../utils/wrapPermalinkFn';

const requireFile = (file: string) => {
  const dataReq = require(file);
  return dataReq.default || dataReq;
};

export function makeRoutesjsPermalink(routeString) {
  return function permalink({ request }) {
    // eslint-disable-next-line no-useless-escape
    return routeString.replace(/(\/|^)([:*][^\/]*?)(\?)?(?=\/|$)/g, (_, start, key, optional) => {
      if ((_ = request[key.substring(1)])) return `/${_}`;
      return optional ? '' : `/${key}`; // TODO: error?
    });
  };
}

function prepareRoutes(settings: SettingsOptions) {
  try {
    const { ssrComponents: ssrFolder, serverPrefix = '' } = settings.$$internal;

    const files = glob.sync(`${settings.srcDir}/routes/*/+(*.js|*.svelte)`);
    const routejsFiles = files.filter((f) => f.endsWith('/route.js'));

    const routes = {};

    /**
     * Set Defaults in Route.js files
     * Add them to the 'routes' object
     */

    routejsFiles.forEach((routeFile) => {
      const routeName = routeFile.replace('/route.js', '').split('/').pop();
      const route = requireFile(routeFile);
      const filesForThisRoute = files
        .filter((r) => r.includes(`/routes/${routeName}`))
        .filter((r) => !r.includes('route.js'));

      if (!route.name) {
        route.name = routeName;
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
        route.data = (page) => {
          page.data = {};
        };
      }

      // find svelte template or set default
      if (!route.template) {
        const defaultLocation = path.resolve(settings.srcDir, `./routes/${routeName}/${routeName}.svelte`);
        const svelteFile = filesForThisRoute.find((f) => f.toLowerCase().endsWith(defaultLocation.toLowerCase()));
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

      route.$$meta = {
        type: 'file',
        addedBy: routeFile,
      };

      routes[routeName] = route;
    });

    /** Import routes/index.js file. */

    if (fs.existsSync(path.resolve(settings.srcDir, `./routes/index.js`))) {
      const routesjs = requireFile(path.resolve(settings.srcDir, `./routes/index.js`));

      Object.keys(routesjs).forEach((unprefixedRouteString) => {
        const routeString = `${serverPrefix}${unprefixedRouteString}`;
        const route = routesjs[unprefixedRouteString];

        if (!route.name) throw new Error(`name required for route defined as ${routeString}`);
        routes[route.name] = {
          data: {}, // default
          all: () => [], // default
          // permalink can be overwritten by the routejs definition if you need more control.
          permalink: wrapPermalinkFn({
            // wrapPermalink adds in prefix
            permalinkFn: makeRoutesjsPermalink(unprefixedRouteString),
            routeName: route.name,
            settings,
          }),
          ...route,

          $$meta: {
            type: `dynamic`,
            addedBy: 'routes.js',
            routeString,
            ...toRegExp(routeString),
          },
        };
      });
    }

    const ssrComponents = glob.sync(`${ssrFolder}/**/*.js`);
    Object.keys(routes).forEach((routeName) => {
      const ssrTemplate = ssrComponents.find((f) =>
        f.toLowerCase().endsWith(routes[routeName].template.replace('.svelte', '.js').toLowerCase()),
      );
      if (!ssrTemplate) {
        console.error(
          `No SSR template found for ${routeName}. Expected at ${routes[routeName].template.replace(
            '.svelte',
            '.js',
          )}. Make sure rollup finished running.`,
        );
      }

      const ssrLayout = ssrComponents.find((f) =>
        f.toLowerCase().endsWith(routes[routeName].layout.replace('.svelte', '.js').toLowerCase()),
      );
      if (!ssrLayout) {
        console.error(
          `No SSR Layout found for ${routeName}. Expected at ${routes[routeName].layout.replace(
            '.svelte',
            '.js',
          )}. Make sure rollup finished running.`,
        );
      }

      routes[routeName].templateComponent = svelteComponent(
        routes[routeName].template.replace('.svlete', ''),
        'routes',
      );
      routes[routeName].layoutComponent = svelteComponent(routes[routeName].layout.replace('.svlete', ''), 'layouts');
    });

    return routes;
  } catch (e) {
    console.error(e);
    return {};
  }
}

export default prepareRoutes;
