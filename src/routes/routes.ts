/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import glob from 'glob';
import kebabcase from 'lodash.kebabcase';
import type { RouteOptions } from './types';

import { svelteComponent, capitalizeFirstLetter } from '../utils';
import { SettingsOptions } from '../utils/types';
import wrapPermalinkFn from '../utils/wrapPermalinkFn';

function routes(settings: SettingsOptions) {
  if (settings.debug.automagic)
    console.log(
      `debug.automagic::
--------- routes.ts -----------
    `,
    );

  const files = glob.sync(`${settings.srcDir}/routes/*/+(*.js|*.svelte)`);

  const ssrFolder = settings.$$internal.ssrComponents;

  const ssrComponents = glob.sync(`${ssrFolder}/*/*.js`);

  const routejsFiles = files.filter((f) => f.endsWith('/route.js'));

  const output = routejsFiles.reduce((out, cv) => {
    const routeName = cv.replace('/route.js', '').split('/').pop();
    const capitalizedRoute = capitalizeFirstLetter(routeName);

    const routeReq = require(cv);
    const route: RouteOptions = routeReq.default || routeReq;
    const filesForThisRoute = files
      .filter((r) => r.includes(`/routes/${routeName}`))
      .filter((r) => !r.includes('route.js'));

    if (!route.permalink) {
      if (settings.debug.automagic) {
        console.log(
          `debug.automagic:: No permalink function found for route "${routeName}". Setting default which will return / for home or /{request.slug}/.`,
        );
      }
      route.permalink = ({ request }) => (request.slug === '/' ? request.slug : `/${request.slug}/`);
    }

    route.permalink = wrapPermalinkFn({ permalinkFn: route.permalink, routeName, settings });

    if (!Array.isArray(route.all) && typeof route.all !== 'function') {
      if (routeName.toLowerCase() === 'home') {
        route.all = [{ slug: '/' }];
      } else {
        route.all = [{ slug: kebabcase(routeName) }];
      }

      if (settings.debug.automagic) {
        console.log(
          `debug.automagic:: No all function or array found for route "${routeName}". Setting default which will return ${JSON.stringify(
            route.all,
          )}`,
        );
      }
    }

    if (route.template) {
      if (typeof route.template === 'string') {
        const componentName = route.template.replace('.svelte', '');
        const ssrComponent = ssrComponents.find((f) => f.endsWith(`${componentName}.js`));
        if (!ssrComponent) {
          console.error(
            `We see you want to load ${route.template}, but we don't see a compiled template in ${settings.$$internal.ssrComponents}. You'll probably see more errors in a second. Make sure you've run rollup.`,
          );
        }

        route.templateComponent = svelteComponent(componentName, 'routes');
      }
    } else {
      const svelteFile = filesForThisRoute.find((f) => f.endsWith(`${capitalizedRoute}.svelte`));
      if (settings.debug.automagic) {
        console.log(
          `debug.automagic:: No template defined for /routes/${routeName}/ looking for ${capitalizedRoute}.svelte`,
        );
      }

      if (svelteFile) {
        if (settings.debug.automagic)
          console.log(`debug.automagic:: Found ${capitalizedRoute}.svelte. Sweet, we'll set it up.`);
        route.template = `${capitalizedRoute}.svelte`;
        route.templateComponent = svelteComponent(svelteFile, 'routes');

        const ssrComponent = ssrComponents.find((f) => f.endsWith(`${capitalizedRoute}.js`));
        if (!ssrComponent) {
          console.error(
            `We see you want to load ${route.template}, but we don't see a compiled template in ${settings.$$internal.ssrComponents}. You'll probably see more errors in a second. Make sure you've run rollup.`,
          );
        }
      } else {
        if (settings.debug.automagic)
          console.log(
            `debug.automagic:: Couldn't find  /routes/${routeName}/${capitalizedRoute}.svelte. Looking for a compiled svelte template in case you're using typescript or have your templates defined outside of your routes.`,
          );
        const compiledSvelteFile = ssrComponents.find((f) => f.endsWith(`${capitalizedRoute}.js`));
        if (compiledSvelteFile) {
          if (settings.debug.automagic)
            console.log(
              `debug.automagic:: Sweet found a compiled component at ${ssrFolder}/${capitalizedRoute}.js, you're good to go.`,
            );
          route.template = `${capitalizedRoute}.svelte`;
          route.templateComponent = svelteComponent(compiledSvelteFile, 'routes');
        }
      }
    }

    if (!route.data) {
      const dataFile = filesForThisRoute.find((f) => f.endsWith(`data.js`));
      if (dataFile) {
        // TODO: v1 removal
        const dataReq = require(dataFile);
        route.data = dataReq.default || dataReq;
        console.warn(
          `WARN: Loading your /routes/${routeName}/data.js file. This functionality is deprecated. Please include your data function in your /routes/${routeName}/route.js object under the 'data' key. As a quick fix you can just import the existing data file and include it as "data" key.`,
        );
      } else {
        route.data = (page) => {
          page.data = {};
        };
      }
    }

    if (route.layout) {
      if (typeof route.layout === 'string' && route.layout.endsWith('.svelte')) {
        route.layout = route.layout.replace('.svelte', '');
        route.layoutComponent = svelteComponent(route.layout, 'layouts');
      }
    } else {
      if (settings.debug.automagic) {
        console.log(
          `debug.automagic:: The route at /routes/${routeName}/route.js doesn't have a layout specified so going to look for a Layout.svelte file.`,
        );
      }
      route.layout = 'Layout.svelte';
      route.layoutComponent = svelteComponent(route.layout, 'layouts');
    }
    // console.log(route);
    out[routeName] = route;

    return out;
  }, {});
  if (settings.debug.automagic) {
    console.log(
      `debug.automagic::
--------- end routes.ts -----------
  `,
    );
  }

  return output;
}

export default routes;
