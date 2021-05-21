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

type Req = {
  path: string;
  query?: any;
  search?: string;
};

interface IFindPrebuildRequest {
  req: Req;
  serverLookupObject: any;
}
export const findPrebuiltRequest = ({ req, serverLookupObject }: IFindPrebuildRequest): RequestOptions | false => {
  // see if we have a request object with the path as is. (could include / or not.)
  let request = serverLookupObject[req.path] ? serverLookupObject[req.path] : false;
  if (!request && req.path[req.path.length - 1] === '/') {
    // check the req.path without a slash.
    request = serverLookupObject[req.path.substring(0, req.path.length - 1)];
  } else if (!request) {
    // check the req.path with a slash.
    request = serverLookupObject[`${req.path}/`];
  }

  if (request) {
    request.req = req;
  }

  return request;
};

// used to filter out requests which we know shouldn't be passed to the elder router.
export const needsElderRequest = ({ req, prefix }) => {
  if (!req.path) return false;
  // check against prefix defined in elder.config.js
  if (prefix.length > 0 && !req.path.startsWith(prefix)) return false;
  if (req.path.startsWith(`${prefix}/_elderjs/`)) return false;
  return true;
};

// make sure we're dealing with a well form elderjs request.
export const initialRequestIsWellFormed = (request: RequestOptions) =>
  !!(request && request.permalink && request.route);

interface IRequestFromDynamicRoute {
  req: Req;
  dynamicRoutes: RouteOptions[];
  requestCache: Map<string, RequestOptions>;
}

export function requestFromDynamicRoute({
  req,
  dynamicRoutes,
  requestCache,
}: IRequestFromDynamicRoute): RequestOptions | false {
  if (requestCache.has(req.path)) {
    const request = requestCache.get(req.path);
    request.req = req;
    return request;
  }
  const route = getDynamicRoute({ path: req.path, dynamicRoutes });
  if (route) {
    const params = extractDynamicRouteParams({ path: req.path, $$meta: route.$$meta });
    const request: RequestOptions = {
      permalink: route.permalink({ request: params }),
      route: route.name,
      type: 'server',
      ...params,
    };
    requestCache.set(req.path, request);
    request.req = { ...req };
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

  async function handleRequest({ res, next, request, dynamic = false }) {
    if (!request.route || typeof request.route !== 'string') return next();
    if (!routes[request.route]) return next();
    const page = new Page({ ...forPage, request, next: dynamic ? next : undefined, route: routes[request.route] });
    const html = await page.html();

    // note: html will be undefined if a dynamic route calls skip() as it aborts page building.
    if (html && !res.headerSent) {
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
      // eslint-disable-next-line consistent-return
      return;
    }
    return next();
  }

  return async ({ req, res, next, request: initialRequest }) => {
    // if a prior middleware hook has already returned.
    if (!res.headerSent) {
      try {
        // initial request may be well formed if it is modified via a hook BEFORE the router runs.
        if (initialRequestIsWellFormed(initialRequest)) return handleRequest({ res, next, request: initialRequest });
        if (!needsElderRequest({ req, prefix })) return next();
        const request = findPrebuiltRequest({ req, serverLookupObject });
        if (request) return handleRequest({ res, next, request });
        const dynamicRequest = requestFromDynamicRoute({ req, dynamicRoutes, requestCache });
        if (dynamicRequest) return handleRequest({ res, next, request: dynamicRequest, dynamic: true });
        return next();
      } catch (e) {
        console.error(e);
        // should fall through to 404
        return next();
      }
    } else {
      return undefined;
    }
  };
}
export default prepareRouter;
