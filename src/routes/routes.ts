/* eslint-disable no-cond-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import glob from 'glob';
import kebabcase from 'lodash.kebabcase';
import toRegExp from 'regexparam';
import path from 'path';
import fs from 'fs-extra';
import type { RouteOptions } from './types';

import { svelteComponent, capitalizeFirstLetter } from '../utils';
import { SettingsOptions } from '../utils/types';
import wrapPermalinkFn from '../utils/wrapPermalinkFn';

const requireFile = (file: string) => {
  const dataReq = require(file);
  return dataReq.default || dataReq;
};

export function makeRoutesjsPermalink(routeString) {
  return function permalink({ request }) {
    return routeString.replace(/(\/|^)([:*][^\/]*?)(\?)?(?=\/|$)/g, (_, start, key, optional) => {
      if ((_ = request[key.substring(1)])) return `/${_}`;
      return optional ? '' : `\${key}`; // TODO: error?
    });
  };
}

function prepareRoutes(settings: SettingsOptions) {
  const { ssrComponents: ssrFolder, serverPrefix = '' } = settings.$$internal;

  const files = glob.sync(`${settings.srcDir}/routes/*/+(*.js|*.svelte)`);
  const routejsFiles = files.filter((f) => f.endsWith('/route.js'));

  // collect routes
  // make sure routes have all the required fields.
  // validate that template exists
  // validate that the layout exists

  // build the router.

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
      const defaultLocation = `/routes/${routeName}/${routeName}.svelte`;
      const svelteFile = filesForThisRoute.find((f) => f.toLowerCase().endsWith(defaultLocation.toLowerCase()));
      if (!svelteFile) {
        console.error(
          `No compiled template for route named "${routeName}". Expected to find it at: ${defaultLocation}. If you are using a different template please define it in your route.js file.`,
        );
      }

      route.template = `/${path.relative(settings.srcDir, svelteFile)}`;
    }

    // set default layout
    if (!route.layout) {
      route.layout = `/layouts/Layout.svelte`;
    }

    route.$$meta = {
      type: 'file',
      addedBy: routeFile,
    };

    routes[routeName] = route;
  });

  /** Import routes.js file. */

  if (fs.existsSync(`${settings.srcDir}/routes/index.js`)) {
    const routesjs = requireFile(path.resolve(settings.srcDir, `./routes/index.js`));
    console.log(routesjs);
    Object.keys(routesjs).forEach((unprefixedRouteString) => {
      const routeString = `${serverPrefix}${unprefixedRouteString}`;
      const route = routesjs[unprefixedRouteString];
      if (!route.name) throw new Error(`name required for route defined as ${routeString}`);
      routes[route.name] = {
        data: {}, // default
        all: () => [], // default
        // permalink adds in prefix
        permalink: wrapPermalinkFn({
          permalinkFn: makeRoutesjsPermalink(unprefixedRouteString),
          routeName: route.name,
          settings,
        }), // can be overwritten by the routejs definition if you need more control.
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

  // const output = routejsFiles.reduce((out, cv) => {
  //   const routeName = cv.replace('/route.js', '').split('/').pop();
  //   const capitalizedRoute = capitalizeFirstLetter(routeName);

  //   const routeReq = require(cv);
  //   const route: RouteOptions = routeReq.default || routeReq;
  //   route.name = routeName;
  //   const filesForThisRoute = files
  //     .filter((r) => r.includes(`/routes/${routeName}`))
  //     .filter((r) => !r.includes('route.js'));

  //   if (!route.permalink) {
  //     if (settings.debug.automagic) {
  //       console.log(
  //         `${logPrefix} No permalink function found for route "${routeName}". Setting default which will return / for home or /{request.slug}/.`,
  //       );
  //     }
  //     route.permalink = ({ request }) => (request.slug === '/' ? request.slug : `/${request.slug}/`);
  //   }

  //   route.permalink = wrapPermalinkFn({ permalinkFn: route.permalink, routeName, settings });

  //   if (!Array.isArray(route.all) && typeof route.all !== 'function') {
  //     if (routeName.toLowerCase() === 'home') {
  //       route.all = [{ slug: '/' }];
  //     } else {
  //       route.all = [{ slug: kebabcase(routeName) }];
  //     }

  //     if (settings.debug.automagic) {
  //       console.log(
  //         `${logPrefix} No all function or array found for route "${routeName}". Setting default which will return ${JSON.stringify(
  //           route.all,
  //         )}`,
  //       );
  //     }
  //   }

  //   if (route.template) {
  //     if (typeof route.template === 'string') {
  //       const componentName = route.template.replace('.svelte', '');
  //       const ssrComponent = ssrComponents.find((f) => f.endsWith(`/routes/${routeName}/${componentName}.js`));
  //       if (!ssrComponent) {
  //         console.error(
  //           `We see you want to load ${route.template}, but we don't see a compiled template in ${settings.$$internal.ssrComponents}. You'll probably see more errors in a second. Make sure you've run rollup.`,
  //         );
  //       }

  //       route.templateComponent = svelteComponent(componentName, 'routes');
  //     }
  //   } else {
  //     // not defined, look for a svelte file...
  //     const svelteFile = filesForThisRoute.find((f) => f.endsWith(`/routes/${routeName}/${capitalizedRoute}.svelte`));
  //     if (settings.debug.automagic) {
  //       console.log(
  //         `${logPrefix} No template defined for /routes/${routeName}/ looking for ${capitalizedRoute}.svelte`,
  //       );
  //     }

  //     if (svelteFile) {
  //       route.template = `${capitalizedRoute}.svelte`;
  //       route.templateComponent = svelteComponent(svelteFile, 'routes');

  //       const ssrComponent = ssrComponents.find((f) => f.endsWith(`/routes/${routeName}/${capitalizedRoute}.js`));
  //       if (!ssrComponent) {
  //         console.error(
  //           `We see you want to load ${route.template}, but we don't see a compiled template in ${settings.$$internal.ssrComponents}. You'll probably see more errors in a second. Make sure you've run rollup.`,
  //         );
  //       }
  //     } else {
  //       // no svelte file
  //       route.template = `${capitalizedRoute}.svelte`;
  //       route.templateComponent = svelteComponent(capitalizedRoute, 'routes');
  //     }
  //   }

  //   if (route.layout) {
  //     if (typeof route.layout === 'string' && route.layout.endsWith('.svelte')) {
  //       route.layout = route.layout.replace('.svelte', '');
  //       route.layoutComponent = svelteComponent(route.layout, 'layouts');
  //     }
  //   } else {
  //     if (settings.debug.automagic) {
  //       console.log(
  //         `${logPrefix} The route at /routes/${routeName}/route.js doesn't have a layout specified so going to look for a Layout.svelte file.`,
  //       );
  //     }
  //     route.layout = 'Layout.svelte';
  //     route.layoutComponent = svelteComponent(route.layout, 'layouts');
  //   }
  //   // console.log(route);
  //   out[routeName] = route;

  //   return out;
  // }, {});

  const ssrComponents = glob.sync(`${ssrFolder}/**/*.js`);
  Object.keys(routes).forEach((routeName) => {
    const parsedTemplate = path.parse(routes[routeName].template);
    const templateLoc = path.join(parsedTemplate.dir, `${parsedTemplate.name}.js`);
    const ssrTemplate = ssrComponents.find((f) => f.endsWith(templateLoc));
    if (!ssrTemplate) {
      console.error(
        `No SSR template found for ${routeName}. Expected at ${path.resolve(
          settings.$$internal.ssrComponents,
          templateLoc,
        )}. Make sure rollup finished running.`,
      );
    }

    const parsedLayout = path.parse(routes[routeName].layout);
    const layoutLoc = path.join(parsedLayout.dir, `${parsedLayout.name}.js`);
    const ssrLayout = ssrComponents.find((f) => f.endsWith(layoutLoc));
    if (!ssrLayout) {
      console.error(
        `No SSR Layout found for ${routeName}. Expected at ${path.resolve(
          settings.$$internal.ssrComponents,
          layoutLoc,
        )}. Make sure rollup finished running.`,
      );
    }

    routes[routeName].templateComponent = svelteComponent(routes[routeName].template, 'routes');
    routes[routeName].layoutComponent = svelteComponent(routes[routeName].layout, 'layouts');
  });

  return routes;
}

export default prepareRoutes;
