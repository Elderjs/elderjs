import {
  extractDynamicRouteParams,
  getDynamicRoute,
  findPrebuiltRequest,
  needsElderRequest,
  initialRequestIsWellFormed,
  requestFromDynamicRoute,
} from '../prepareRouter';

import { describe, it, expect } from 'vitest';
import getConfig from '../../utils/getConfig';
import { ProcessedRoutesObject } from '../types';

const settings = getConfig({ css: 'inline' });

describe('#prepareRouter', () => {
  const routes: ProcessedRoutesObject = {
    reports: {
      data: {},
      permalink: () => '',
      template: 'Reports.svelte',
      layout: 'Report.svelte',
      name: 'reports',
      all: () => [],
      $$meta: {
        type: 'dynamic',
        addedBy: 'routes.js',
        routeString: '/dev/reports/:report/',
        keys: ['report'],
        pattern: /^\/dev\/reports\/([^/]+?)\/?$/i,
      },
      templateComponent: () => '',
      layoutComponent: () => '',
      dynamic: true,
    },
    example: {
      data: {},
      permalink: () => '',
      template: 'Reports.svelte',
      layout: 'Report.svelte',
      name: 'example',
      all: () => [],
      $$meta: {
        type: 'dynamic',
        addedBy: 'routes.js',
        routeString: '/dev/example/:one/:two/',
        keys: ['one', 'two'],
        pattern: /^\/dev\/example\/([^/]+?)\/([^/]+?)\/?$/i,
      },
      templateComponent: () => '',
      layoutComponent: () => '',
      dynamic: true,
    },
  };
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
    it('Properly identifies dynamic routes', () => {
      const r = getDynamicRoute({
        path: `/dev/reports/test/`,
        dynamicRoutes: Object.values(routes),
      });
      expect(r && r.name).toEqual('reports');

      const a = getDynamicRoute({
        path: `/dev/example/test/other/`,
        dynamicRoutes: Object.values(routes),
      });
      expect(a && a.name).toEqual('example');
    });
  });
  describe('#findPrebuiltRequest', () => {
    const serverLookupObject = {
      '/': { name: 'root', route: 'root', slug: 'root', type: 'server' },
      '/test/': { name: 'test', route: 'test', slug: 'test', type: 'server' },
    };

    it('Finds root', () => {
      expect(findPrebuiltRequest({ req: { path: '/' }, serverLookupObject })).toEqual({
        name: 'root',
        req: { path: '/', query: undefined, search: undefined },
        route: 'root',
        slug: 'root',
        type: 'server',
      });
    });
    it('Finds finds a request it should', () => {
      expect(findPrebuiltRequest({ req: { path: '/test/' }, serverLookupObject })).toEqual({
        name: 'test',
        req: { path: '/test/', query: undefined, search: undefined },
        route: 'test',
        slug: 'test',
        type: 'server',
      });
    });
    it('Finds finds a request with missing trailing slash', () => {
      expect(findPrebuiltRequest({ req: { path: '/test' }, serverLookupObject })).toEqual({
        name: 'test',
        req: { path: '/test', query: undefined, search: undefined },
        route: 'test',
        slug: 'test',
        type: 'server',
      });
    });
    it('Misses a request it should', () => {
      expect(findPrebuiltRequest({ req: { path: '/nope' }, serverLookupObject })).toBeUndefined();
    });
  });
  describe('#needsElderRequest', () => {
    it(`Doesn't include a req.path`, () => {
      expect(needsElderRequest({ req: {}, prefix: '' })).toBeFalsy();
    });
    it('No prefix Needs an elder response', () => {
      expect(needsElderRequest({ req: { path: '/foo' }, prefix: '' })).toBeTruthy();
    });
    it('Includes a prefix and needs a response', () => {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(initialRequestIsWellFormed({ permalink: '/true', type: 'server' })).toBeFalsy();
    });
  });
  describe('#requestFromDynamicRoute', () => {
    const requestCache = new Map();
    it('Parses a dynamic route into a request properly and populates cache', () => {
      expect(
        requestFromDynamicRoute({ settings, req: { path: '/dev/reports/hereitis/' }, requestCache, routes }),
      ).toEqual({
        permalink: '',
        report: 'hereitis',
        req: { path: '/dev/reports/hereitis/', query: undefined, search: undefined },
        route: 'reports',
        type: 'server',
      });
      expect(requestCache.has('/dev/reports/hereitis/')).toBeTruthy();
    });
    it('Parses a dynamic route into a request properly and skips the cache', () => {
      expect(
        requestFromDynamicRoute({
          settings,
          req: { path: '/dev/reports/without-cache/' },
          requestCache: undefined,
          routes,
        }),
      ).toEqual({
        permalink: '',
        report: 'without-cache',
        req: { path: '/dev/reports/without-cache/', query: undefined, search: undefined },
        route: 'reports',
        type: 'server',
      });
      expect(requestCache.has('/dev/reports/without-cache/')).toBeFalsy();
    });
    it('correctly adds in different search and query params', () => {
      expect(
        requestFromDynamicRoute({
          settings,
          req: { path: '/dev/reports/somethingnew/', query: { foo: 'bar' }, search: '?foo=bar' },
          requestCache,
          routes,
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
});
