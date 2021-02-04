import {
  extractDynamicRouteParams,
  getDynamicRoute,
  findPrebuiltRequest,
  needsElderRequest,
  initialRequestIsWellFormed,
  requestFromDynamicRoute,
} from '../prepareRouter';

describe('#prepareRouter', () => {
  const dynamicRoutes = [
    {
      data: {},
      permalink: () => '',
      template: 'Reports.svelte',
      layout: 'Report.svelte',
      name: 'reports',
      $$meta: {
        type: 'dynamic',
        addedBy: 'routes.js',
        routeString: '/dev/reports/:report/',
        keys: ['report'],
        pattern: /^\/dev\/reports\/([^/]+?)\/?$/i,
      },
      templateComponent: () => '',
      layoutComponent: () => '',
    },
    {
      data: {},
      permalink: () => '',
      template: 'Reports.svelte',
      layout: 'Report.svelte',
      name: 'example',
      $$meta: {
        type: 'dynamic',
        addedBy: 'routes.js',
        routeString: '/dev/example/:one/:two/',
        keys: ['one', 'two'],
        pattern: /^\/dev\/example\/([^/]+?)\/([^/]+?)\/?$/i,
      },
      templateComponent: () => '',
      layoutComponent: () => '',
    },
  ];
  describe('#extractDynamicRouteParams', () => {
    it('Extracts 1 param', () => {
      expect(
        extractDynamicRouteParams({
          path: '/dev/reports/test/',
          $$meta: {
            type: 'dynamic',
            addedBy: 'routes.js',
            routeString: '/dev/reports/:report/',
            keys: ['report'],
            pattern: /^\/dev\/reports\/([^/]+?)\/?$/i,
          },
        }),
      ).toEqual({ report: 'test' });
    });
    it('Extracts 2 params', () => {
      expect(
        extractDynamicRouteParams({
          path: '/dev/example/hey/yo/',
          $$meta: {
            type: 'dynamic',
            addedBy: 'routes.js',
            routeString: '/dev/example/:one/:two/',
            keys: ['one', 'two'],
            pattern: /^\/dev\/example\/([^/]+?)\/([^/]+?)\/?$/i,
          },
        }),
      ).toEqual({ one: 'hey', two: 'yo' });
    });
  });
  describe('#getDynamicRoute', () => {
    it('It properly identifies dynamic routes', () => {
      const r = getDynamicRoute({
        path: `/dev/reports/test/`,
        dynamicRoutes,
      });
      expect(r && r.name).toEqual('reports');

      const a = getDynamicRoute({
        path: `/dev/example/test/other/`,
        dynamicRoutes,
      });
      expect(a && a.name).toEqual('example');
    });
  });
  describe('#findPrebuiltRequest', () => {
    const serverLookupObject = {
      '/': { name: 'root' },
      '/test/': { name: 'test' },
    };

    it('Finds root', () => {
      expect(findPrebuiltRequest({ path: '/', serverLookupObject })).toEqual({
        name: 'root',
        req: { path: '/', query: undefined, search: undefined },
      });
    });
    it('Finds finds a request it should', () => {
      expect(findPrebuiltRequest({ path: '/test/', serverLookupObject })).toEqual({
        name: 'test',
        req: { path: '/test/', query: undefined, search: undefined },
      });
    });
    it('Finds finds a request with missing trailing slash', () => {
      expect(findPrebuiltRequest({ path: '/test', serverLookupObject })).toEqual({
        name: 'test',
        req: { path: '/test', query: undefined, search: undefined },
      });
    });
    it('Misses a request it should', () => {
      expect(findPrebuiltRequest({ path: '/nope', serverLookupObject })).toBeUndefined();
    });
  });
  describe('#needsElderRequest', () => {
    it(`It doesn't include a req.path`, () => {
      expect(needsElderRequest({ req: {}, prefix: '' })).toBeFalsy();
    });
    it('No prefix Needs an elder response', () => {
      expect(needsElderRequest({ req: { path: '/foo' }, prefix: '' })).toBeTruthy();
    });
    it('It includes a prefix and needs a response', () => {
      expect(needsElderRequest({ req: { path: '/test/foo' }, prefix: '/test' })).toBeTruthy();
    });
    it('Is a /_elderjs/ request', () => {
      expect(needsElderRequest({ req: { path: '/test/_elderjs/svelte/test.123122.js' }, prefix: '/test' })).toBeFalsy();
    });
    it('Is a misc request not within prefix', () => {
      expect(needsElderRequest({ req: { path: '/this.123122.js' }, prefix: '/test' })).toBeFalsy();
    });
  });
  describe('#initialRequestIsWellFormed', () => {
    it('Is a well formed request', () => {
      expect(initialRequestIsWellFormed({ permalink: '/true', type: 'server', route: 'foo' })).toBeTruthy();
    });
    it('Is not a well formed request', () => {
      // @ts-ignore
      expect(initialRequestIsWellFormed({ permalink: '/true', type: 'server' })).toBeFalsy();
    });
  });
  describe('#requestFromDynamicRoute', () => {
    const requestCache = new Map();
    it('Parses a dynamic route into a request properly and populates cache', () => {
      expect(requestFromDynamicRoute({ path: '/dev/reports/hereitis/', requestCache, dynamicRoutes })).toEqual({
        permalink: '',
        report: 'hereitis',
        req: { path: '/dev/reports/hereitis/', query: undefined, search: undefined },
        route: 'reports',
        type: 'server',
      });
      expect(requestCache.has('/dev/reports/hereitis/')).toBeTruthy();
    });
    it('It correctly adds in different search and query params', () => {
      expect(
        requestFromDynamicRoute({
          path: '/dev/reports/somethingnew/',
          query: { foo: 'bar' },
          search: '?foo=bar',
          requestCache,
          dynamicRoutes,
        }),
      ).toEqual({
        permalink: '',
        report: 'somethingnew',
        req: { path: '/dev/reports/somethingnew/', query: { foo: 'bar' }, search: '?foo=bar' },
        route: 'reports',
        type: 'server',
      });
      expect(requestCache.has('/dev/reports/somethingnew/')).toBeTruthy();
    });
  });

  //   describe('#prepareRouter', ()=>{
  //     // const next = () => 'next() was called';
  //     // const settings = {
  //     //   $$internal: {
  //     //     serverPrefix: '/dev',
  //     //   },
  //     // };
  //     // // prefix not found
  //     // expect(
  //     //   await hook.run({
  //     //     next,
  //     //     req: { path: '/' },
  //     //     settings,
  //     //   }),
  //     // ).toEqual('next() was called');
  //     // const headers = [];
  //     // const end = jest.fn();
  //     // // route found with slash added
  //     // expect(
  //     //   await hook.run({
  //     //     next,
  //     //     req: { path: '/dev' },
  //     //     res: {
  //     //       headerSent: false,
  //     //       setHeader: (key, val) => {
  //     //         headers.push(`${key}-${val}`);
  //     //       },
  //     //       end,
  //     //     },
  //     //     routes: {
  //     //       Home: {
  //     //         data: { foo: 'bar' },
  //     //       },
  //     //     },
  //     //     serverLookupObject: {
  //     //       '/dev/': {
  //     //         route: 'Home',
  //     //       },
  //     //     },
  //     //     settings,
  //     //   }),
  //     // ).toBeUndefined();
  //     // // no serverPrefix
  //     // // prefix not found
  //     // expect(
  //     //   await hook.run({
  //     //     next,
  //     //     req: { path: '/not-found' },
  //     //     settings: {
  //     //       $$internal: {
  //     //         serverPrefix: '',
  //     //       },
  //     //     },
  //     //     serverLookupObject: {
  //     //       '/': {
  //     //         route: 'Home',
  //     //       },
  //     //     },
  //     //   }),
  //     // ).toEqual('next() was called');

  //     // expect(end).toHaveBeenCalledTimes(1);
  //     // expect(headers).toEqual(['Content-Type-text/html']);
  //   })
});
