const { resolve } = require('path');

const defaultConfig = {
  debug: { automagic: false, build: false, hooks: false, performance: false, shortcodes: false, stacks: false },
  distDir: 'public',
  srcDir: 'src',
  rootDir: process.cwd(),
  build: {
    numberOfWorkers: -1,
    shuffleRequests: false,
  },
  server: {
    prefix: '',
  },
  shortcodes: {
    closePattern: '}}',
    openPattern: '{{',
  },
  hooks: {
    disable: [],
  },
  origin: '',
  plugins: {},
};

jest.mock('../validations.ts', () => ({
  getDefaultConfig: () => defaultConfig,
}));

jest.mock('cosmiconfig', () => {
  return {
    cosmiconfigSync: () => ({
      search: () => ({ config: defaultConfig }),
    }),
  };
});

describe('#getConfig', () => {
  const output = {
    $$internal: {
      clientComponents: resolve(process.cwd(), './public/svelte'),
      ssrComponents: resolve(process.cwd(), './___ELDER___/compiled'),
    },
    debug: {
      automagic: false,
      build: false,
      hooks: false,
      performance: false,
      shortcodes: false,
      stacks: false,
    },
    distDir: resolve(process.cwd(), './public'),
    rootDir: process.cwd(),
    srcDir: resolve(process.cwd(), './src'),
    server: {
      prefix: '',
    },
    shortcodes: {
      closePattern: '}}',
      openPattern: '{{',
    },
    hooks: {
      disable: [],
    },
    origin: '',
    plugins: {},
    build: false,
    context: 'unknown',
    worker: false,
    server: false,
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it('throws but is catched, fallbacks to default', () => {
    jest.mock('fs', () => ({
      readFileSync: () => {
        throw new Error();
      },
    }));
    // eslint-disable-next-line global-require
    const getConfig = require('../getConfig').default;

    expect(getConfig()).toEqual(output);
  });

  it('it accepts custom initalization options', () => {
    jest.mock('fs', () => ({
      readFileSync: () => {
        throw new Error();
      },
    }));
    // eslint-disable-next-line global-require
    const getConfig = require('../getConfig').default;

    const common = {
      distDir: resolve(process.cwd(), './t/public'),
      rootDir: resolve(process.cwd(), './t'),
      srcDir: resolve(process.cwd(), './t/src'),
      $$internal: {
        clientComponents: resolve(process.cwd(), './t/public/svelte'),
        ssrComponents: resolve(process.cwd(), './t/___ELDER___/compiled'),
      },
    };

    expect(getConfig({ context: 'serverless', rootDir: 't' })).toEqual({
      ...output,
      ...common,
      context: 'serverless',
    });

    expect(getConfig({ context: 'server', rootDir: 't' })).toEqual({
      ...output,
      ...common,
      context: 'server',
      server: {
        prefix: '',
      },
    });

    expect(getConfig({ context: 'build', rootDir: 't' })).toEqual({
      ...output,
      ...common,
      context: 'build',
      build: {
        numberOfWorkers: -1,
        shuffleRequests: false,
      },
    });
    expect(getConfig({ context: 'serverless', rootDir: 't' })).toStrictEqual(
      expect.objectContaining({
        context: 'serverless',
        ...common,
      }),
    );
  });

  it('works', () => {
    jest.mock('fs', () => ({
      readFileSync: () =>
        JSON.stringify({
          compilerOptions: {
            outDir: 'build',
          },
        }),
    }));

    // eslint-disable-next-line global-require
    const getConfig = require('../getConfig').default;

    expect(getConfig()).toEqual(output);
  });
});
