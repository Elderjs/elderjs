import getUniqueId from './getUniqueId.js';
import perf, { Perf, PerfTimings } from './perf.js';
import prepareProcessStack from './prepareProcessStack.js';
import { ShortcodeDefinitions } from '../shortcodes/types.js';
import { QueryOptions, Stack, RequestObject, SettingsOptions, HydrateOptions, TErrors, Helpers } from './types.js';
import { RouteOptions, ProcessedRoutesObject } from '../routes/types.js';
import createReadOnlyProxy from './createReadOnlyProxy.js';
import outputStyles from './outputStyles.js';
import mountComponentsInHtml from '../partialHydration/mountComponentsInHtml.js';
import hydrateComponents from '../partialHydration/hydrateComponents.js';

// eslint-disable-next-line no-use-before-define
const buildPage = async (page: Page) => {
  try {
    page.perf.end('initToBuildGap');

    await page.runHook('request', page);

    page.perf.start('data');
    if (typeof page.route.data === 'object') {
      page.data = { ...page.data, ...page.route.data };
    } else if (typeof page.route.data === 'function') {
      try {
        const dataResponse = await page.route.data({
          data: page.data,
          query: page.query,
          helpers: page.helpers,
          settings: createReadOnlyProxy(page.settings, 'settings', `${page.request.route}: data function`),
          request: createReadOnlyProxy(page.request, 'request', `${page.request.route}: data function`),
          errors: page.errors,
          perf: page.perf.prefix('data'),
          allRequests: createReadOnlyProxy(page.allRequests, 'allRequests', `${page.request.route}: data function`),
          next: page.next,
        });
        if (dataResponse && Object.keys(dataResponse).length > 0) {
          page.data = {
            ...page.data,
            ...dataResponse,
          };
        }
      } catch (e) {
        page.errors.push(e);
      }
    }
    page.perf.end('data');

    await page.runHook('data', page);

    if (page.shouldSkipRequest) {
      page.next();
      return page;
    }

    // start building templates
    page.perf.start('html.template');
    page.templateHtml = await page.route.templateComponent({
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
    page.layoutHtml = await page.route.layoutComponent({
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
    page.layoutHtml = await mountComponentsInHtml({ page, html: page.layoutHtml, hydrateOptions: false });

    hydrateComponents(page);

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
  } catch (err) {
    // console.error(err);
    page.errors.push(err);
  }
  if (page.errors.length > 0) {
    await page.runHook('error', page);
  }

  return page;
};

interface SvelteCss {
  cssMap: string;
  css: string;
}

export interface IComponentToHydrate {
  name: string;
  hydrateOptions: HydrateOptions;
  client: any;
  props: false | any;
  id: string;
  prepared?: {
    clientPropsString?: string;
    clientPropsUrl?: string;
    propsString?: string;
  };
}

class Page {
  uid: string;

  runHook: (string, Object) => Promise<any>;

  next: () => void;

  resNext: () => void;

  shouldSkipRequest: boolean;

  allRequests: Array<RequestObject>;

  request: RequestObject;

  settings: SettingsOptions;

  helpers: Helpers;

  data: Record<string, unknown>;

  route: RouteOptions;

  query: QueryOptions;

  errors: TErrors;

  routes: ProcessedRoutesObject;

  processStack: ReturnType<typeof prepareProcessStack>;

  perf: Perf;

  layoutHtml: string;

  templateHtml: string;

  cssString: string;

  svelteCss: Array<SvelteCss>;

  htmlString: string;

  head: string;

  headString: string;

  footerString: string;

  styleTag: string;

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

  shortcodes: ShortcodeDefinitions;

  componentsToHydrate: IComponentToHydrate[];

  timings: PerfTimings;

  constructor({
    request,
    settings,
    next = () => {
      console.error(`Cannot call next on a non SSR route ${this.route.name}`);
    },
    query,
    helpers,
    data,
    route,
    runHook,
    allRequests,
    routes,
    errors,
    shortcodes,
  }) {
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
    this.head = '';
    this.headString = '';
    this.footerString = '';
    this.styleTag = '';
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
    this.timings = [];
    this.processStack = prepareProcessStack(this);
    this.perf.end('constructor');
    this.perf.start('initToBuildGap');
    this.shouldSkipRequest = false;
    this.next = () => {
      this.shouldSkipRequest = true;
    };
    this.resNext = next;
    this.componentsToHydrate = [];
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
