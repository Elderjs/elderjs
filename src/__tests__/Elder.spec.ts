/* eslint-disable global-require */
import path, { sep } from 'path';
import normalizeSnapshot from '../utils/normalizeSnapshot';

describe('#Elder', () => {
  jest.mock(`..${sep}routes${sep}routes`, () => () => ({
    'route-a': {
      hooks: [
        {
          hook: 'routeHook',
          name: 'route hook',
          description: 'test',
          run: jest.fn(),
        },
      ],
    },
    'test-b': { hooks: [] },
  }));

  jest.mock(`..${sep}utils${sep}getConfig`, () => () => ({
    $$internal: {
      clientComponents: `test${sep}public${sep}svelte`,
      ssrComponents: `test${sep}___ELDER___${sep}compiled`,
    },
    debug: {
      automagic: true,
    },
    distDir: `test${sep}public`,
    rootDir: 'test',
    srcDir: `test${sep}src`,
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
  }));

  jest.mock(`..${sep}workerBuild`);

  jest.mock(`..${sep}utils${sep}prepareRunHook`, () => (page) =>
    async function processHook(hook) {
      if (hook === 'bootstrap' && page.hooks && page.hooks.length) {
        for (const pluginHook of page.hooks) {
          if (pluginHook.$$meta.type === 'plugin') {
            // eslint-disable-next-line
            await pluginHook.run({});
          }
        }
      }
      return null;
    },
  );
  beforeEach(() => jest.resetModules());

  it('hookSrcFile not found', async () => {
    jest.mock('../utils/validations', () => ({
      validatePlugin: (i) => i,
      validateHook: (i) => i,
      validateRoute: (i) => i,
      validateShortcode: (i) => i,
    }));
    jest.mock('fs-extra', () => ({
      existsSync: () => true,
    }));
    jest.mock('test/___ELDER___/compiled/fakepath/Test.js', () => () => ({}), { virtual: true });
    jest.mock(
      'test/__ELDER__/hooks.js',
      () => ({
        default: [
          {
            hook: 'bootstrap',
            name: 'test hook from file',
            description: 'just for testing',
            run: () => jest.fn(),
          },
        ],
      }),
      { virtual: true },
    );
    jest.mock(
      path.resolve(process.cwd(), `./test/src/plugins/elder-plugin-upload-s3/index.js`),
      () => ({
        hooks: [],
        routes: { 'test-a': { hooks: [], template: 'fakepath/Test.svelte', all: [] }, 'test-b': { data: () => {} } },
        config: {},
        name: 'test',
        description: 'test',
        init: jest.fn(),
      }),
      {
        virtual: true,
      },
    );
    // eslint-disable-next-line import/no-dynamic-require
    const { Elder } = require(`..${sep}index`);
    const elder = await new Elder({ context: 'server', worker: false });
    await elder.bootstrap();
    await elder.worker([]);
    expect(normalizeSnapshot(elder)).toMatchSnapshot();
  });

  it('srcPlugin found', async () => {
    jest.mock(`..${sep}utils${sep}validations`, () => ({
      validatePlugin: (i) => i,
      validateHook: (i) => i,
      validateRoute: (i) => i,
      validateShortcode: (i) => i,
    }));
    jest.mock('fs-extra', () => ({
      existsSync: () => true,
    }));
    jest.mock(
      `${process.cwd()}${sep}test${sep}___ELDER___${sep}compiled${sep}fakepath${sep}Test.js`,
      () => () => ({}),
      { virtual: true },
    );
    jest.mock(
      `${process.cwd()}${sep}test${sep}src${sep}hooks.js`,
      () => ({
        default: [
          {
            hook: 'bootstrap',
            name: 'test hook from file',
            description: 'just for testing',
            run: () => jest.fn(),
          },
        ],
      }),
      { virtual: true },
    );
    jest.mock(
      `${process.cwd()}${sep}test${sep}src${sep}plugins${sep}elder-plugin-upload-s3${sep}index.js`,
      () => ({
        hooks: [
          {
            hook: 'customizeHooks',
            name: 'test hook',
            description: 'just for testing',
            run: () => Promise.resolve({ plugin: 'elder-plugin-upload-s3' }),
            $$meta: {
              type: 'hooks.js',
              addedBy: 'validations.spec.ts',
            },
          },
          {
            hook: 'bootstrap',
            name: 'test hook 2',
            description: 'just for testing',
            run: () => Promise.resolve({}),
            $$meta: {
              type: 'hooks.js',
              addedBy: 'validations.spec.ts',
            },
          },
          {
            hook: 'bootstrap',
            name: 'test hook 3',
            description: 'just for testing',
            run: () => Promise.resolve(null),
            $$meta: {
              type: 'hooks.js',
              addedBy: 'validations.spec.ts',
            },
          },
        ],
        routes: {
          'test-a': {
            hooks: [],
            template: `fakepath${sep}Test.svelte`,
            all: () => Promise.resolve([{ slug: `${sep}test` }]),
            permalink: () => Promise.resolve('/'),
          },
          'test-b': { data: () => {}, all: [] },
        },
        config: {},
        name: 'test',
        description: 'test',
        init: jest.fn().mockImplementation((p) => p),
      }),
      {
        virtual: true,
      },
    );
    // eslint-disable-next-line import/no-dynamic-require
    const { Elder } = require(`..${sep}index`);
    const elder = await new Elder({ context: 'server', worker: false });
    await elder.bootstrap();
    expect(normalizeSnapshot(elder)).toMatchSnapshot();
  });
});
