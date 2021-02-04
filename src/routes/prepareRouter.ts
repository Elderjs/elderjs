/* eslint-disable no-plusplus */
import routeSort from 'route-sort';
import get from 'lodash.get';
import Page from '../utils/Page';
import { RequestOptions } from '../utils/types';
import { RouteOptions } from './types';

export function extractDynamicRouteParams({ path, $$meta }) {
  let i = 0;
  const out = {};
  const ms = $$meta.pattern.exec(path);
  while (i < $$meta.keys.length) {
    out[$$meta.keys[i]] = ms[++i] || null;
  }
  return out;
}

interface IGetDynamicRoute {
  path: string;
  dynamicRoutes: RouteOptions[];
}

export function getDynamicRoute({ path, dynamicRoutes }: IGetDynamicRoute): RouteOptions | false {
  let i = 0;
  for (; i < dynamicRoutes.length; i++) {
    if (dynamicRoutes[i].$$meta.pattern.test(path)) {
      return dynamicRoutes[i];
    }
  }
  return false;
}

interface IFindPrebuildRequest {
  path: string;
  query?: any;
  search?: string;
  serverLookupObject: any;
}
export const findPrebuiltRequest = ({
  path,
  query,
  search,
  serverLookupObject,
}: IFindPrebuildRequest): RequestOptions | false => {
  // see if we have a request object with the path as is. (could include / or not.)
  let request = serverLookupObject[path] ? serverLookupObject[path] : false;
  if (!request && path[path.length - 1] === '/') {
    // check the path without a slash.
    request = serverLookupObject[path.substring(0, path.length - 1)];
  } else if (!request) {
    // check the path with a slash.
    request = serverLookupObject[`${path}/`];
  }

  if (request) {
    request.req = { path, query, search };
  }

  return request;
};

export const needsElderRequest = ({ req, prefix }) => {
  if (!req.path) return false;
  if (prefix.length > 0 && !req.path.startsWith(prefix)) return false;
  if (req.path.startsWith(`${prefix}/_elderjs/`)) return false;
  return true;
};

export const initialRequestIsWellFormed = (request: RequestOptions): Boolean =>
  !!(request && request.permalink && request.route);

interface IRequestFromDynamicRoute {
  path: string;
  query?: any;
  search?: string;
  dynamicRoutes: RouteOptions[];
  requestCache: Map<string, RequestOptions>;
}

export function requestFromDynamicRoute({
  path,
  query,
  search,
  dynamicRoutes,
  requestCache,
}: IRequestFromDynamicRoute): RequestOptions | false {
  if (requestCache.has(path)) {
    const request = requestCache.get(path);
    request.req = { path, query, search };
    return request;
  }
  const route = getDynamicRoute({ path, dynamicRoutes });
  if (route) {
    const params = extractDynamicRouteParams({ path, $$meta: route.$$meta });
    const request: RequestOptions = {
      permalink: route.permalink({ request: params }),
      route: route.name,
      type: 'server',
      ...params,
    };
    requestCache.set(path, request);
    request.req = { path, query, search };
    return request;
  }
  return false;
}

function prepareRouter(Elder) {
  const { routes, serverLookupObject, settings, ...elder } = Elder;
  const requestCache = new Map();

  // sort the routes in order of specificity
  const dynamicRoutes: RouteOptions[] = routeSort(
    Object.keys(routes).filter((cv) => routes[cv] && routes[cv].$$meta && routes[cv].$$meta.type === 'dynamic'),
  ).map((cv) => routes[cv]);

  const prefix = get(settings, '$$internal.serverPrefix', '');

  const forPage = {
    settings,
    routes,
    query: elder.query,
    helpers: elder.helpers,
    data: elder.data,
    runHook: elder.runHook,
    allRequests: elder.allRequests,
    errors: elder.errors,
    shortcodes: elder.shortcodes,
  };

  async function handleRequest({ res, next, request }) {
    if (!request.route || typeof request.route !== 'string') return next();
    if (!routes[request.route]) return next();
    const page = new Page({ ...forPage, request, route: routes[request.route] });
    const html = await page.html();

    if (html && !res.headerSent) {
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
    }
    return next();
  }

  return async ({ req, res, next, request: initialRequest }) => {
    try {
      if (initialRequestIsWellFormed(initialRequest)) return handleRequest({ res, next, request: initialRequest });
      if (!needsElderRequest({ req, prefix })) return next();
      let request = findPrebuiltRequest({ ...req, serverLookupObject });
      if (!request) request = requestFromDynamicRoute({ ...req, dynamicRoutes, requestCache });
      if (request) return handleRequest({ res, next, request });
      return next();
    } catch (e) {
      console.error(e);
      return next();
    }
  };
}
export default prepareRouter;
