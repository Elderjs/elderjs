/* eslint-disable no-param-reassign */
import getUniqueId from './getUniqueId';
import perf from './perf';
import prepareProcessStack from './prepareProcessStack';
import { ShortcodeDefs } from '../shortcodes/types';
import { QueryOptions, Stack, RequestOptions, SettingsOptions } from './types';
import { RoutesOptions } from '../routes/types';
import createReadOnlyProxy from './createReadOnlyProxy';
import outputStyles from './outputStyles';
import mountComponentsInHtml from '../partialHydration/mountComponentsInHtml';

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
      if (dataResponse && Object.keys(dataResponse).length > 0) {
        page.data = {
          ...page.data,
          ...dataResponse,
        };
      }
    }
    page.perf.end('data');
    await page.runHook('data', page);

    // start building templates
    page.perf.start('html.template');
    page.templateHtml = page.route.templateComponent({
      page,
      props: {
        data: page.data,
        helpers: page.helpers,
        settings: createReadOnlyProxy(page.settings, 'settings', `${page.request.route}: Svelte Template`),
        request: createReadOnlyProxy(page.request, 'request', `${page.request.route}: Svelte Template`),
      },
    });
    page.perf.end('html.template');

    page.perf.start('html.layout');
    page.layoutHtml = page.route.layoutComponent({
      page,
      props: {
        data: page.data,
        helpers: page.helpers,
        settings: createReadOnlyProxy(page.settings, 'settings', `${page.request.route}: Svelte Layout`),
        request: createReadOnlyProxy(page.request, 'request', `${page.request.route}: Svelte Layout`),
        templateHtml: page.templateHtml,
      },
    });
    page.perf.end('html.layout');

    await page.runHook('shortcodes', page);

    // shortcodes can add svelte components, so we have to process the resulting html accordingly.
    page.layoutHtml = mountComponentsInHtml({ page, html: page.layoutHtml, hydrateOptions: false });

    await page.runHook('stacks', page);

    // prepare for head hook
    page.head = page.processStack('headStack');

    page.cssString = '';
    page.cssString = page.processStack('cssStack');
    page.styleTag = outputStyles(page);
    page.headString = `${page.head}${page.styleTag}`;

    await page.runHook('head', page);

    // prepare for compileHtml
    const beforeHydrate = page.processStack('beforeHydrateStack');
    const hydrate = page.processStack('hydrateStack');
    page.htmlAttributesString = page.processStack('htmlAttributesStack');
    page.bodyAttributesString = page.processStack('bodyAttributesStack');

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

interface SvelteCss {
  cssMap: String;
  css: String;
}

class Page {
  uid: string;

  runHook: (string, Object) => Promise<any>;

  allRequests: Array<RequestOptions>;

  request: RequestOptions;

  settings: SettingsOptions;

  helpers: {};

  data: Object;

  route: any;

  query: QueryOptions;

  errors: any[];

  routes: RoutesOptions;

  processStack: any;

  perf: any;

  layoutHtml: string;

  templateHtml: string;

  cssString: string;

  svelteCss: Array<SvelteCss>;

  htmlString: string;

  bodyAttributesString: string;

  htmlAttributesString: string;

  bodyAttributesStack: Stack;

  htmlAttributesStack: Stack;

  moduleStack: Stack;

  moduleJsStack: Stack;

  headStack: Stack;

  cssStack: Stack;

  beforeHydrateStack: Stack;

  hydrateStack: Stack;

  customJsStack: Stack;

  footerStack: Stack;

  shortcodes: ShortcodeDefs;

  constructor({ request, settings, query, helpers, data, route, runHook, allRequests, routes, errors, shortcodes }) {
    this.uid = getUniqueId();
    this.request = request;
    this.settings = settings;
    perf(this);
    this.perf.start('page');
    this.perf.start('constructor');
    this.runHook = runHook;
    this.allRequests = allRequests;
    this.helpers = helpers;
    this.data = data;
    this.route = route;
    this.query = query;
    this.errors = [...errors];
    this.routes = routes;
    this.cssString = '';
    this.htmlString = '';
    this.htmlAttributesString = '';
    this.bodyAttributesString = '';
    this.bodyAttributesStack = [];
    this.htmlAttributesStack = [];
    this.headStack = [];
    this.cssStack = [];
    this.beforeHydrateStack = [];
    this.hydrateStack = [];
    this.customJsStack = [];
    this.footerStack = [];
    this.moduleJsStack = [];
    this.moduleStack = [];
    this.shortcodes = shortcodes;
    this.svelteCss = [];
    this.processStack = prepareProcessStack(this);
    this.perf.end('constructor');
    this.perf.start('initToBuildGap');
  }

  build() {
    return buildPage(this).then((page) => page);
  }

  html() {
    if (this.htmlString) {
      return this.htmlString;
    }
    return buildPage(this).then((page) => page.htmlString);
  }
}

export default Page;
