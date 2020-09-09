import Page from '../Page';

jest.mock('../getUniqueId', () => () => 'xxxxxxxxxx');
jest.mock('../prepareProcessStack', () => (page) => (stackName) => {
  const data = {
    headStack: 'headStack',
    cssStack: 'cssStack',
    hydrateStack: 'hydrateStack',
    beforeHydrateStack: 'beforeHydrateStack',
    customJsStack: 'customJsStack',
    footerStack: 'footerStack',
  };
  if (!page.hydrateStack || !page.hydrateStack.length) {
    // should be done in stacks hook
    page.footerStack = ['footerStack'];
    page.customJsStack = ['customJsStack'];
    page.hydrateStack = ['hydrateStack'];
  }
  if (data[stackName]) {
    return data[stackName];
  }
  return '';
});
jest.mock('../perf', () => (page) => {
  page.perf = {
    timings: [],
    start: jest.fn(),
    end: jest.fn(),
    stop: jest.fn(),
  };
});

const allRequests = [
  {
    slug: 'ash-flat',
    random: 94,
    state: {
      id: 6,
      slug: 'arkansas',
    },
    route: 'cityNursingHomes',
    type: 'build',
    permalink: '/arkansas/ash-flat-nursing-homes/',
  },
  {
    slug: 'albertville',
    random: 33,
    state: {
      id: 4,
      slug: 'alabama',
    },
    route: 'cityNursingHomes',
    type: 'build',
    permalink: '/alabama/albertville-nursing-homes/',
  },
];

const request = {
  slug: 'ash-flat',
  random: 94,
  state: {
    id: 6,
    slug: 'arkansas',
  },
  route: 'cityNursingHomes',
  type: 'build',
  permalink: '/arkansas/ash-flat-nursing-homes/',
};

const settings = {
  server: false,
  build: {
    shuffleRequests: false,
    numberOfWorkers: -1,
  },
  locations: {
    public: './public/',
    svelte: {
      ssrComponents: './___ELDER___/compiled/',
      clientComponents: './public/dist/svelte/',
    },
    systemJs: '/dist/static/s.min.js',
    intersectionObserverPoly: '/dist/static/intersection-observer.js',
    buildFolder: '',
    srcFolder: './src/',
    assets: './public/dist/static/',
  },
  debug: {
    stacks: false,
    hooks: false,
    performance: false,
    build: false,
    automagic: false,
  },
  hooks: {
    disable: [],
  },
  plugins: {
    'elder-plugin-upload-s3': {
      dataBucket: 'elderguide.com',
      htmlBucket: 'elderguide.com',
      deployId: '11111111',
    },
  },
  typescript: false,
  $$internal: {
    hashedComponents: {
      AutoComplete: 'entryAutoComplete',
      Footer: 'entryFooter',
      Header: 'entryHeader',
      HeaderAutoComplete: 'entryHeaderAutoComplete',
      Home: 'entryHomeAutoComplete',
      HomeAutoComplete: 'entryHomeAutoComplete',
      Modal: 'entryModal',
    },
  },
  worker: true,
  cacheBustingId: 'XmjyWGYZtV',
};

const query = {
  db: {
    db: {},
    pool: {
      _events: {},
      _eventsCount: 0,
      options: {
        connectionString: 'postgresql://user:user@localhost:5099/db',
        max: 10,
        idleTimeoutMillis: 10000,
      },
      _clients: [],
      _idle: [],
      _pendingQueue: [],
      ending: false,
      ended: false,
    },
    cnString: {
      connectionString: 'postgresql://user:user@localhost:5099/db',
    },
  },
};

const helpers = {
  permalinks: {},
  metersInAMile: 0.00062137119224,
};

const route = {
  hooks: [],
  template: 'Content.svelte',
  data: () => Promise.resolve({ worldPopulation: 7805564950 }),
  templateComponent: jest.fn(),
  layout: jest.fn(() => '<div class="container"></div>'),
  parent: 'home',
  $$meta: {
    type: 'route',
    addedBy: 'routejs',
  },
};

const routes = {
  content: {
    hooks: [],
    template: 'Content.svelte',
    $$meta: {
      type: 'route',
      addedBy: 'routejs',
    },
  },
  home: {
    hooks: [
      {
        hook: 'data',
        name: 'testToData',
        description: 'Adds test to data object',
        priority: 50,
      },
    ],
    template: 'Home.svelte',
    $$meta: {
      type: 'route',
      addedBy: 'routejs',
    },
  },
};

describe('#Page', () => {
  const hooks = [];
  const runHook = (hookName) => {
    hooks.push(hookName);
  };

  const pageInput = {
    allRequests,
    request,
    settings,
    query,
    helpers,
    data: {},
    route,
    routes,
    errors: [],
    runHook,
  };

  const expectedOutput = `<!DOCTYPE html>
      <html lang="en">
        <head>
          headStack<style data-name="cssStack">cssStack</style>
        </head>
        <body class="cityNursingHomes">
          <div class="container"></div>
          beforeHydrateStack
          <script data-name="hydrateStack">hydrateStack</script>
          customJsStack
          footerStack
        </body>
      </html>`;

  it('initialize and build', async () => {
    const page = new Page(pageInput);
    expect(page).toMatchSnapshot();
    expect(hooks).toEqual(['modifyCustomProps']);
    await page.build();
    expect(hooks).toEqual(['modifyCustomProps', 'request', 'data', 'stacks', 'head', 'html', 'requestComplete']);
    expect(page).toMatchSnapshot();
    const htmlString = await page.html();
    expect(htmlString.trim()).toEqual(expectedOutput);
  });

  it('init and request html', async () => {
    const page = new Page({ ...pageInput, route: { ...pageInput.route, data: { worldPopulation: 7805564950 } } });
    const html = await page.html();
    expect(html.trim()).toEqual(expectedOutput);
  });

  it('init and request html, throw catched errors', async () => {
    const page = new Page({
      ...pageInput,
      runHook: (hook) => {
        if (hook === 'request' || hook === 'error') {
          throw new Error(`mocked for hook: ${hook}`);
        }
        return runHook(hook);
      },
    });
    expect(await page.html()).toEqual('{}');
  });
});
