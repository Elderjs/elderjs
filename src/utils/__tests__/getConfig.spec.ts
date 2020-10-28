const { getDefaultConfig } = require('../validations');

const defaultConfig = getDefaultConfig();

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
      clientComponents: `${process.cwd()}/public/svelte`,
      ssrComponents: `${process.cwd()}/___ELDER___/compiled`,
    },
    build: {
      numberOfWorkers: -1,
      shuffleRequests: false,
    },
    debug: {
      automagic: false,
      build: false,
      hooks: false,
      performance: false,
      shortcodes: false,
      stacks: false,
    },
    distDir: `${process.cwd()}/public`,
    rootDir: process.cwd(),
    srcDir: `${process.cwd()}/src`,
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

    expect(getConfig({ context: 'serverless', rootDir: 't' })).toStrictEqual(
      expect.objectContaining({
        context: 'serverless',
        distDir: `${process.cwd()}/t/public`,
        rootDir: `${process.cwd()}/t`,
        srcDir: `${process.cwd()}/t/src`,
        $$internal: {
          clientComponents: `${process.cwd()}/t/public/svelte`,
          ssrComponents: `${process.cwd()}/t/___ELDER___/compiled`,
        },
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
