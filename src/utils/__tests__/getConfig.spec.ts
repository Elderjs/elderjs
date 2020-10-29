const defaultConfig = {
  debug: { automagic: false, build: false, hooks: false, performance: false, shortcodes: false, stacks: false },
  distDir: 'public',
  srcDir: 'src',
  rootDir: 'test',
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

jest.mock('path', () => {
  return {
    resolve: (...strings) => strings.join('/').replace('./', '').replace('test/test', 'test'),
  };
});

process.cwd = () => 'test';

describe('#getConfig', () => {
  const output = {
    $$internal: {
      clientComponents: 'test/public/svelte/',
      ssrComponents: 'test/___ELDER___/compiled/',
    },
    debug: {
      automagic: false,
      build: false,
      hooks: false,
      performance: false,
      shortcodes: false,
      stacks: false,
    },
    distDir: 'test/public',
    rootDir: 'test',
    srcDir: 'test/src',
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
      distDir: 't/public',
      rootDir: 't',
      srcDir: 't/src',
      $$internal: {
        clientComponents: 't/public/svelte/',
        ssrComponents: 't/___ELDER___/compiled/',
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
