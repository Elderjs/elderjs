import routeSort from 'route-sort';
import Page from '../utils/Page.js';
import { RequestObject, ServerOptions, SettingsOptions, ServerLookupObject } from '../utils/types.js';
import { ProcessedRouteOptions, ProcessedRoutesObject } from './types.js';
import fixCircularJson from '../utils/fixCircularJson.js';
import { Elder as ElderClass } from '../core/Elder.js';

export function extractDynamicRouteParams({ path, $$meta }) {
  let i = 0;
  const out = {} as RequestObject;
  const ms = $$meta.pattern.exec(path);
  while (i < $$meta.keys.length) {
    out[$$meta.keys[i]] = ms[++i] || null;
  }
  return out;
}

interface IGetDynamicRoute {
  path: string;
  dynamicRoutes: ProcessedRouteOptions[];
}

export function getDynamicRoute({ path, dynamicRoutes }: IGetDynamicRoute): ProcessedRouteOptions | false {
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

interface IGetSpecialRequest {
  req: Req;
  serverLookupObject: ServerLookupObject;
  server: ServerOptions;
}

export const getSpecialRequest = ({ req, server, serverLookupObject }: IGetSpecialRequest) => {
  // check data routes
  let request;
  let type;
  if (server.dataRoutes) {
    const dataSuffix = typeof server.dataRoutes === 'string' ? server.dataRoutes : 'data.json';
    if (req.path.endsWith(dataSuffix)) {
      const lookup = req.path.replace(dataSuffix, '');
      request = serverLookupObject[lookup];
      type = 'data';
    }
  }

  if (server.allRequestsRoute) {
    const dataSuffix = typeof server.allRequestsRoute === 'string' ? server.allRequestsRoute : '/allRequests.json';
    if (req.path === (server.prefix ? `${server.prefix}${dataSuffix}` : dataSuffix)) {
      // just needs any request.
      const k1 = Object.keys(serverLookupObject)[0];
      request = serverLookupObject[k1];
      type = 'allRequests';
    }
  }

  if (request) {
    const { req: priorReq, ...prior } = request;
    request = JSON.parse(JSON.stringify(prior));
    request.req = req || priorReq;
  }

  return { request, type };
};

interface IFindPrebuildRequest {
  req: Req;
  serverLookupObject: ServerLookupObject;
}

export const findPrebuiltRequest = ({ req, serverLookupObject }: IFindPrebuildRequest): RequestObject | false => {
  // see if we have a request object with the path as is. (could include / or not.)
  let request = serverLookupObject[req.path] ? serverLookupObject[req.path] : false;
  if (!request && req.path[req.path.length - 1] === '/') {
    // check the req.path without a slash.
    request = serverLookupObject[req.path.substring(0, req.path.length - 1)];
  } else if (!request) {
    // check the req.path with a slash.
    request = serverLookupObject[`${req.path}/`];
  }

  if (typeof request !== 'undefined' && request) {
    request = JSON.parse(JSON.stringify(request)) as RequestObject;
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
export const initialRequestIsWellFormed = (request: RequestObject) => !!(request && request.permalink && request.route);

interface IRequestFromDynamicRoute {
  req: Req;
  routes: ProcessedRoutesObject;
  requestCache: Map<string, RequestObject> | undefined;
  settings: SettingsOptions;
}

export function requestFromDynamicRoute({
  req,
  routes,
  requestCache,
  settings,
}: IRequestFromDynamicRoute): RequestObject | false {
  if (requestCache && requestCache.has(req.path)) {
    const request = requestCache.get(req.path);
    request.req = req;
    return request;
  }

  // sort the routes in order of specificity
  const routesPresort = Object.keys(routes).filter(
    (cv) => routes[cv] && routes[cv].$$meta && routes[cv].$$meta.type === 'dynamic',
  );
  const dynamicRoutes: ProcessedRouteOptions[] = routeSort(routesPresort).map((cv) => routes[cv]);

  const route = getDynamicRoute({ path: req.path, dynamicRoutes });
  if (route) {
    const params = extractDynamicRouteParams({ path: req.path, $$meta: route.$$meta });
    const request: RequestObject = {
      permalink: route.permalink({ request: params, settings }),
      route: route.name,
      type: 'server',
      ...params,
    };
    if (requestCache) {
      requestCache.set(req.path, request);
    }
    request.req = { ...req };
    return request;
  }
  return false;
}

function prepareRouter(elder: ElderClass) {
  const requestCache = elder.settings.server && elder.settings.server.cacheRequests ? new Map() : undefined;

  async function handleRequest({ res, next, request, dynamic = false, type = '' }) {
    if (!request.route || typeof request.route !== 'string') return next();
    if (!elder.routes[request.route]) return next();
    const page = new Page({
      settings: elder.settings,
      routes: elder.routes,
      query: elder.query,
      helpers: elder.helpers,
      data: elder.data,
      runHook: elder.runHook,
      allRequests: elder.allRequests,
      errors: elder.errors,
      shortcodes: elder.shortcodes,
      request,
      next: dynamic ? next : undefined,
      route: elder.routes[request.route],
    });
    const { htmlString: html, data, allRequests } = await page.build();

    if (type === 'data' && data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(fixCircularJson(data)));
      return undefined;
    }

    if (type === 'allRequests' && allRequests) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(fixCircularJson(allRequests)));
      return undefined;
    }

    if (html && !res.headerSent && !res.headersSent) {
      // note: html will be undefined if a dynamic route calls skip() as it aborts page building.
      res.setHeader('Content-Type', 'text/html');
      res.end(html);

      return undefined;
    }

    return next();
  }

  return async ({ req, res, next, request: initialRequest }) => {
    // if a prior middleware hook has already returned.
    if (!res.headerSent && !res.headersSent) {
      try {
        // initial request may be well formed if it is modified via a hook BEFORE the router runs.
        if (initialRequestIsWellFormed(initialRequest)) return handleRequest({ res, next, request: initialRequest });
        if (!needsElderRequest({ req, prefix: elder.settings.$$internal.serverPrefix })) return next();
        const { request: specialRequest, type } = getSpecialRequest({
          req,
          server: elder.settings.server as ServerOptions,
          serverLookupObject: elder.serverLookupObject,
        });
        if (specialRequest) {
          return handleRequest({ res, next, request: { ...specialRequest, ...initialRequest }, type });
        }
        const request = findPrebuiltRequest({
          req,
          serverLookupObject: elder.serverLookupObject,
        });
        if (request) return handleRequest({ res, next, request: { ...request, ...initialRequest } });
        const dynamicRequest = requestFromDynamicRoute({
          req,
          routes: elder.routes,
          requestCache,
          settings: elder.settings,
        });
        if (dynamicRequest)
          return handleRequest({ res, next, request: { ...dynamicRequest, ...initialRequest }, dynamic: true });
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
