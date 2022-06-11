import Page from '../Page.js';
import normalizeSnapshot from '../normalizeSnapshot.js';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});
vi.mock('../getUniqueId', () => ({ default: () => 'xxxxxxxxxx' }));
vi.mock('../prepareProcessStack', () => ({
  default: (page) => (stackName) => {
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
  },
}));
vi.mock('../perf', () => ({
  default: (page) => {
    page.perf = {
      timings: [],
      start: vi.fn(),
      end: vi.fn(),
      stop: vi.fn(),
      prefix: vi.fn(),
    };
  },
}));

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
  distDir: 'test',
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
    intersectionObserverPoly: '/dist/static/intersection-observer.js',
    buildFolder: '',
    srcFolder: './src/',
    assets: './public/dist/static/',
  },
  debug: {
    stacks: false,
    hooks: true,
    performance: false,
    build: false,
    automagic: false,
  },
  props: {},
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
    distElder: 'test/_elderjs',
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
  templateComponent: vi.fn(),
  layout: 'Layout.svelte',
  layoutComponent: vi.fn(() => '<div class="container"></div>'),
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
    shortcodes: [],
    perf: {
      start: () => {},
      stop: () => {},
    },
  };

  it('initialize and build', async () => {
    const page = new Page(pageInput);
    expect(normalizeSnapshot(page)).toMatchSnapshot();
    await page.build();

    expect(hooks).toEqual([
      'request',
      'data',
      'shortcodes',
      'stacks',
      'head',
      'compileHtml',
      'html',
      'requestComplete',
    ]);
    expect(normalizeSnapshot(page)).toMatchSnapshot();
  });
});
