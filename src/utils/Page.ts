import getUniqueId from './getUniqueId';
import perf from './perf';
import { prepareProcessStack } from './prepareProcessStack';
import { QueryOptions, SettingOptions, ConfigOptions, RequestOptions } from './types';
import { RoutesOptions } from '../routes/types';
import createReadOnlyProxy from './createReadOnlyProxy';

const buildPage = async (page) => {
  try {
    page.perf.end('initToBuildGap');
    // stacks
    page.headStack = [];
    page.cssStack = [];
    page.beforeHydrateStack = [];
    page.hydrateStack = [];
    page.customJsStack = [];
    page.footerStack = [];

    await page.runHook('request', page);

    page.perf.start('data');
    if (typeof page.route.data === 'object') {
      page.data = { ...page.data, ...page.route.data };
    } else if (typeof page.route.data === 'function') {
      const dataResponse = await page.route.data({
        data: page.data,
        query: page.query,
        helpers: page.helpers,
        settings: createReadOnlyProxy(page.settings, 'settings', 'data.js'),
        request: createReadOnlyProxy(page.request, 'request', 'data.js'),
        errors: page.errors,
        perf: page.perf,
        allRequests: createReadOnlyProxy(page.allRequests, 'allRequests', 'data.js'),
      });
      if (dataResponse) {
        page.data = dataResponse;
      }
    }
    page.perf.end('data');
    await page.runHook('data', page);

    // start building templates
    page.perf.start('html.template');

    // template building starts here

    const routeHTML = page.route.templateComponent({
      page,
      props: {
        data: page.data,
        helpers: page.helpers,
        settings: page.settings,
        request: page.request,
      },
    });

    page.perf.end('html.template');

    page.perf.start('html.layout');
    const layoutHtml = page.route.layout({
      page,
      props: {
        data: page.data,
        helpers: page.helpers,
        settings: page.settings,
        page,
        routeHTML,
      },
    });
    page.perf.end('html.layout');

    // Run header hooks / stacks to make headString
    await page.runHook('stacks', page);
    page.head = page.processStack('headStack');
    page.cssString = '';
    page.cssString = page.processStack('cssStack');
    page.styleTag = `<style data-name="cssStack">${page.cssString}</style>`;
    page.headString = `${page.head}${page.styleTag}`;
    page.beforeHydrate = page.processStack('beforeHydrateStack');
    page.hydrate = `<script data-name="hydrateStack">${page.processStack('hydrateStack')}</script>`;
    page.customJs = page.processStack('customJsStack');
    page.footer = page.processStack('footerStack');

    await page.runHook('head', page);

    page.perf.start('html.createHtmlString');
    page.htmlString = `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${page.headString}
        </head>
        <body class="${page.request.route}">
          ${layoutHtml}
          ${page.hydrateStack.length > 0 ? page.beforeHydrate : ''}
          ${page.hydrateStack.length > 0 ? page.hydrate : ''}
          ${page.customJsStack.length > 0 ? page.customJs : ''}
          ${page.footerStack.length > 0 ? page.footer : ''}
        </body>
      </html>
    `;
    page.perf.end('html.createHtmlString');

    await page.runHook('html', page);

    // disconnect timings so we don't get duplicates on next use of page.
    page.perf.end('page');
    page.perf.stop();

    page.timings = page.perf.timings;

    await page.runHook('requestComplete', page);

    if (page.errors.length > 0) {
      await page.runHook('error', page);
    }

    return page;
  } catch (err) {
    console.log(err, page.permalink);
    page.errors.push(err);
    await page.runHook('error', page);
  }
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

  customProps: any;

  htmlString: string;

  constructor({
    request,
    settings,
    query,
    helpers,
    data,
    route,
    runHook,
    allRequests,
    routes,
    errors,
    customProps = {},
  }) {
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
    this.customProps = customProps;
    this.htmlString = '';

    this.processStack = prepareProcessStack(this);

    this.runHook('modifyCustomProps', this);

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
      .catch((e) => JSON.stringify(e));
  }
}

export default Page;
