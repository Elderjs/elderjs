import kebabcase from 'lodash.kebabcase';
import { parse as toRegExp } from 'regexparam';
import path from 'path';

import { svelteComponent, validateRoute } from '../utils/index.js';
import { SettingsOptions } from '../utils/types.js';
import wrapPermalinkFn from '../utils/wrapPermalinkFn.js';
import windowsPathFix from '../utils/windowsPathFix.js';
import makeDynamicPermalinkFn from './makeDynamicPermalinkFn.js';
import { ProcessedRouteOptions, RouteOptions, ProcessedRoutesObject } from './types.js';
import { unhashUrl } from '../core/getFilesAndWatcher.js';

const requireFile = async (file: string) => {
  const dataReq = await import(file);
  return dataReq.default || dataReq;
};

export async function prepareRoute({
  file: hashedFile,
  settings,
}: {
  file: string;
  settings: SettingsOptions;
}): Promise<RouteOptions | false> {
  const file = unhashUrl(hashedFile);
  const routeName = file.replace('/route.js', '').split('/').pop();
  const route: RouteOptions = await requireFile(file);
  route.$$meta = {
    type: 'file',
    addedBy: file,
  };

  const filesForThisRoute = settings.$$internal.files.all
    .filter((r) => r.includes(`/routes/${routeName}`))
    .filter((r) => !r.includes('route.js'));

  if (!route.name) {
    route.name = routeName;
  }

  // handle string based permalinks
  if (typeof route.permalink === 'string') {
    const routeString = `${settings.$$internal.serverPrefix}${route.permalink}`;
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

  const unhashedSsr = settings.$$internal.files.server.map(unhashUrl);

  const ssrTemplate = unhashedSsr.find((f) => {
    const suffix = route.template.toLowerCase().replace('.svelte', '.js').replace(settings.srcDir.toLowerCase(), '');
    return f.toLowerCase().endsWith(windowsPathFix(suffix));
  });
  if (!ssrTemplate) {
    console.error(
      `No SSR template found for ${routeName}. Expected at ${route.template.replace(
        '.svelte',
        '.js',
      )}. Make sure bundling has finished`,
    );
  }

  const ssrLayout = unhashedSsr.find((f) => {
    const suffix = route.layout.toLowerCase().replace('.svelte', '.js').replace(settings.srcDir.toLowerCase(), '');
    return f.toLowerCase().endsWith(windowsPathFix(suffix));
  });
  if (!ssrLayout) {
    console.error(
      `No SSR Layout found for ${routeName}. Expected at ${route.layout.replace(
        '.svelte',
        '.js',
      )}. Make sure bundling has finished`,
    );
  }

  route.templateComponent = svelteComponent(route.template, 'routes');
  route.layoutComponent = svelteComponent(route.layout, 'layouts');

  return validateRoute(route) && route;
}

async function prepareRoutes(settings: SettingsOptions): Promise<ProcessedRoutesObject> {
  try {
    const routes: ProcessedRoutesObject = {};
    for (const file of settings.$$internal.files.routes) {
      const processed = await prepareRoute({ file, settings });
      if (processed) {
        routes[processed.name] = processed as ProcessedRouteOptions;
      }
    }

    return routes;
  } catch (e) {
    console.error(e);
    return {};
  }
}

export default prepareRoutes;
