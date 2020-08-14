process.cwd = () => 'test';

jest.mock('path', () => ({
  resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
  join: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
}));

jest.mock('../utils/getConfig', () => () => ({
  debug: {
    automagic: true,
  },
  locations: {
    srcFolder: './src/',
    buildFolder: './__ELDER__/',
    svelte: {
      ssrComponents: './___ELDER___/compiled/',
      clientComponents: './public/dist/svelte/',
    },
  },
  server: {
    prefix: '/dev',
  },
  build: {
    shuffleRequests: false,
    numberOfWorkers: 4,
  },
  typescript: true,
  plugins: {
    'elder-plugin-upload-s3': {
      dataBucket: 'elderguide.com',
      htmlBucket: 'elderguide.com',
      deployId: '11111111',
    },
  },
  hooks: {
    disable: false,
  },
}));

jest.mock('../utils/getHashedSvelteComponents', () => () => ({
  File1: 'entryFile1',
  File2: 'entryFile2',
}));

jest.mock('../utils/validations', () => ({
  validatePlugin: (i) => i,
  validateHook: (i) => i,
  validateRoute: (i) => i,
}));

jest.mock('../utils/prepareRunHook', () => () => () => Promise.resolve());

describe('#Elder', () => {
  beforeEach(() => jest.resetModules());

  it('throws when plugin not found', async () => {
    jest.mock('fs-extra', () => ({
      existsSync: () => false,
    }));
    // eslint-disable-next-line global-require
    const { Elder } = require('../Elder');
    await expect(async () => {
      await new Elder({ context: 'build', worker: false });
    }).rejects.toThrow('Plugin elder-plugin-upload-s3 not found in plugins or node_modules folder.');
  });

  it('srcPlugin found', async () => {
    jest.mock('fs-extra', () => ({
      existsSync: () => true,
    }));
    jest.mock(
      'test/src/plugins/elder-plugin-upload-s3/index.js',
      () => ({
        hooks: [
          {
            hook: 'customizeHooks',
            name: 'test hook',
            description: 'just for testing',
            run: jest.fn(),
            $$meta: {
              type: 'hooks.js',
              addedBy: 'validations.spec.ts',
            },
          },
        ],
        routes: {},
        config: {},
        name: 'test',
        description: 'test',
        init: jest.fn(),
      }),
      {
        virtual: true,
      },
    );
    // eslint-disable-next-line global-require
    const { Elder } = require('../Elder');
    const elder = await new Elder({ context: 'server', worker: false });
    await elder.bootstrap();
    expect(elder).toMatchSnapshot();
  });
});
