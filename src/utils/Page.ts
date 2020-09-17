/* eslint-disable no-param-reassign */
import getUniqueId from './getUniqueId';
import perf from './perf';
import prepareProcessStack from './prepareProcessStack';
import { QueryOptions, Stack, SettingOptions, ConfigOptions, RequestOptions, ShortcodeDefs } from './types';
import { RoutesOptions } from '../routes/types';
import createReadOnlyProxy from './createReadOnlyProxy';

const buildPage = async (page) => {
  try {
    page.perf.end('initToBuildGap');

    await page.runHook('request', page);

    page.perf.start('data');
    if (typeof page.route.data === 'object') {
      page.data = { ...page.data, ...page.route.data };
    } else if (typeof page.route.data === 'function') {
      const dataResponse = await page.route.data({
        data: page.data,
        query: page.query,
        helpers: page.helpers,
        settings: createReadOnlyProxy(page.settings, 'settings', `${page.request.route}: data function`),
        request: createReadOnlyProxy(page.request, 'request', `${page.request.route}: data function`),
        errors: page.errors,
        perf: page.perf,
        allRequests: createReadOnlyProxy(page.allRequests, 'allRequests', `${page.request.route}: data function`),
      });
      if (dataResponse) {
        page.data = dataResponse;
      }
    }
    page.perf.end('data');
    await page.runHook('data', page);

    // start building templates
    page.perf.start('html.template');
    page.routeHtml = page.route.templateComponent({
      page,
      props: {
        data: page.data,
        helpers: page.helpers,
        settings: page.settings,
        request: page.request,
      },
    });
    page.perf.end('html.template');

    // shortcodes here.

    await page.runHook('shortcodes', page);

    // TODO: readonly proxies?
    page.perf.start('html.layout');
    page.layoutHtml = page.route.layout({
      page,
      props: {
        data: page.data,
        helpers: page.helpers,
        settings: page.settings,
        request: page.request,
        routeHTML: page.routeHtml, // TODO: depreciate this
        routeHtml: page.routeHtml,
      },
    });
    page.perf.end('html.layout');

    await page.runHook('stacks', page);

    // prepare for head hook
    page.head = page.processStack('headStack');
    page.cssString = '';
    page.cssString = page.processStack('cssStack');
    page.styleTag = `<style>${page.cssString}</style>`;
    page.headString = `${page.head}${page.styleTag}`;

    await page.runHook('head', page);

    // prepare for compileHtml
    const beforeHydrate = page.processStack('beforeHydrateStack');
    const hydrate = `<script>${page.processStack('hydrateStack')}</script>`;
    const customJs = page.processStack('customJsStack');
    const footer = page.processStack('footerStack');

    page.footerString = `
    ${page.hydrateStack.length > 0 ? beforeHydrate : '' /* page.hydrateStack.length is correct here */}
    ${page.hydrateStack.length > 0 ? hydrate : ''}
    ${page.customJsStack.length > 0 ? customJs : ''}
    ${page.footerStack.length > 0 ? footer : ''}
    `;

    await page.runHook('compileHtml', page);

    await page.runHook('html', page);

    // disconnect timings so we don't get duplicates on next use of page.
    page.perf.end('page');
    page.perf.stop();

    page.timings = page.perf.timings;

    await page.runHook('requestComplete', page);

    if (page.errors.length > 0) {
      await page.runHook('error', page);
    }
  } catch (err) {
    page.errors.push(err);
    await page.runHook('error', page);
  }
  return page;
};

class Page {
  uid: string;

  runHook: (string, Object) => Promise<any>;

  allRequests: Array<RequestOptions>;

  request: RequestOptions;

  settings: ConfigOptions & SettingOptions;

  helpers: {};

  data: Object;

  route: any;

  query: QueryOptions;

  errors: any[];

  routes: RoutesOptions;

  processStack: any;

  perf: any;

  layoutHtml: string;

  routeHtml: string;

  cssString: string;

  htmlString: string;

  headStack: Stack;

  cssStack: Stack;

  beforeHydrateStack: Stack;

  hydrateStack: Stack;

  customJsStack: Stack;

  footerStack: Stack;

  shortcodes: ShortcodeDefs;

  constructor({ request, settings, query, helpers, data, route, runHook, allRequests, routes, errors, shortcodes }) {
    this.uid = getUniqueId();
    perf(this);
    this.perf.start('page');
    this.perf.start('constructor');
    this.runHook = runHook;
    this.allRequests = allRequests;
    this.request = request;
    this.settings = settings;
    this.helpers = helpers;
    this.data = data;
    this.route = route;
    this.query = query;
    this.errors = [...errors];
    this.routes = routes;
    this.cssString = '';
    this.htmlString = '';

    this.headStack = [];
    this.cssStack = [];
    this.beforeHydrateStack = [];
    this.hydrateStack = [];
    this.customJsStack = [];
    this.footerStack = [];
    this.shortcodes = shortcodes;

    this.processStack = prepareProcessStack(this);

    this.perf.end('constructor');

    this.perf.start('initToBuildGap');
  }

  build() {
    return buildPage(this);
  }

  html() {
    if (this.htmlString) {
      return this.htmlString;
    }
    return buildPage(this)
      .then((page) => page.htmlString)
      .catch(JSON.stringify);
  }
}

export default Page;
