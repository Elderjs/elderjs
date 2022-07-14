import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolve } from 'path';
import normalizeSnapshot from '../../utils/normalizeSnapshot.js';

vi.mock(`../routes/routes`, () => () => ({
  'route-a': {
    hooks: [
      {
        hook: 'routeHook',
        name: 'route hook',
        description: 'test',
        run: vi.fn(),
      },
    ],
  },
  'test-b': { hooks: [] },
}));

vi.mock(`../utils/getConfig`, () => ({
  default: () => ({
    $$internal: {
      clientComponents: `test/public/svelte`,
      ssrComponents: `test/___ELDER___/compiled`,
      findComponent: () => ({ ssr: true, client: true, iife: undefined }),
    },
    debug: {},
    distDir: `test/public`,
    rootDir: 'test',
    srcDir: `test/src`,
    server: {
      prefix: `/dev`,
    },
    build: {
      shuffleRequests: false,
      numberOfWorkers: 4,
    },
    plugins: {
      'elder-plugin-upload-s3': {
        dataBucket: 'elderguide.com',
        htmlBucket: 'elderguide.com',
        deployId: '11111111',
      },
    },
    hooks: {
      disable: ['randomHook'],
    },
  }),
}));

vi.mock(`../workerBuild`);

vi.mock(
  `../utils/prepareRunHook`,
  () => (page) =>
    async function processHook(hook) {
      if (hook === 'bootstrap' && page.hooks && page.hooks.length) {
        for (const pluginHook of page.hooks) {
          if (pluginHook.$$meta.type === 'plugin') {
            await pluginHook.run({});
          }
        }
      }
      return null;
    },
);

beforeEach(() => {
  vi.resetModules();
});

describe('#Elder', () => {
  it('hookSrcFile not found', async () => {
    vi.mock('../utils/validations', () => ({
      validatePlugin: (i) => i,
      validateHook: (i) => i,
      validateRoute: (i) => i,
      validateShortcode: (i) => i,
    }));

    vi.mock('fs-extra', () => ({
      default: {
        existsSync: () => true,
        readJSONSync: () => ({ version: '1.2.3' }),
        ensureDirSync: () => '',
      },
    }));
    vi.mock('test/___ELDER___/compiled/fakepath/Test.js', () => () => ({}));
    vi.mock('test/__ELDER__/hooks.js', () => ({
      default: [
        {
          hook: 'bootstrap',
          name: 'test hook from file',
          description: 'just for testing',
          run: () => vi.fn(),
        },
      ],
    }));
    vi.mock(resolve(process.cwd(), `./test/src/plugins/elder-plugin-upload-s3/index.js`), () => ({
      hooks: [],
      routes: { 'test-a': { hooks: [], template: 'fakepath/Test.svelte', all: [] }, 'test-b': { data: () => '' } },
      config: {},
      name: 'test',
      description: 'test',
      init: vi.fn(),
    }));
    const { Elder } = await import(`../../index`);
    const elder = await new Elder({ context: 'server', worker: true });
    await elder.bootstrap();
    await elder.worker([]);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    delete elder.perf.timings;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore

    delete elder.settings.$$internal.files;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    delete elder.settings.$$internal.reloadHash;
    expect(normalizeSnapshot(elder)).toMatchSnapshot();
  });
});
