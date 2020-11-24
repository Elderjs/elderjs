/* eslint-disable global-require */
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
  const { resolve } = require('path');

  const output = {
    $$internal: {
      ssrComponents: resolve(process.cwd(), './___ELDER___/compiled'),
      clientComponents: resolve(process.cwd(), `./public/_elderjs/svelte`),
      distElder: resolve(process.cwd(), `./public/_elderjs`),
      // findComponent: () => {},
      prefix: '[Elder.js]:',
    },
    build: false,
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
    server: false,
    shortcodes: {
      closePattern: '}}',
      openPattern: '{{',
    },
    hooks: {
      disable: [],
    },
    origin: '',
    plugins: {},
    context: 'unknown',
    worker: false,
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it('it sets the expected default', () => {
    jest.mock('fs-extra', () => {
      return {
        ensureDirSync: () => {},
        readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
      };
    });
    // eslint-disable-next-line global-require
    const getConfig = require('../getConfig').default;

    expect(getConfig()).toStrictEqual(
      expect.objectContaining({
        ...output,
        $$internal: {
          ...output.$$internal,
          findComponent: expect.anything(),
        },
      }),
    );
  });

  describe('it accepts custom initalization options', () => {
    jest.mock('fs-extra', () => {
      return {
        ensureDirSync: () => {},
        readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
      };
    });
    // eslint-disable-next-line global-require
    const getConfig = require('../getConfig').default;

    const common = {
      distDir: resolve(process.cwd(), './t/public'),
      rootDir: resolve(process.cwd(), './t'),
      srcDir: resolve(process.cwd(), './t/src'),
    };
    const common$$Internal = {
      ssrComponents: resolve(process.cwd(), './t/___ELDER___/compiled'),
      clientComponents: resolve(process.cwd(), `./t/public/_elderjs/svelte`),
      distElder: resolve(process.cwd(), `./t/public/_elderjs`),
      // findComponent: () => {},
      prefix: '[Elder.js]:',
    };

    it('gives back a custom context such as serverless', () => {
      jest.mock('fs-extra', () => {
        return {
          ensureDirSync: () => {},
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'serverless', rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'serverless',
        }),
      );
      expect(r.$$internal).toMatchObject(common$$Internal);
    });

    it('it sets a server without a prefix', () => {
      jest.mock('fs-extra', () => {
        return {
          ensureDirSync: () => {},
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '',
          },
        }),
      );
      expect(r.$$internal).toMatchObject(common$$Internal);
    });

    it('it sets a server with a prefix', () => {
      jest.mock('fs-extra', () => {
        return {
          ensureDirSync: () => {},
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', server: { prefix: 'testing' }, rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: 'testing',
          },
        }),
      );
      expect(r.$$internal).toMatchObject(common$$Internal);
    });
    it('it sets build with default', () => {
      jest.mock('fs-extra', () => {
        return {
          ensureDirSync: () => {},
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'build', rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'build',
          build: {
            numberOfWorkers: -1,
            shuffleRequests: false,
          },
        }),
      );
      expect(r.$$internal).toMatchObject(common$$Internal);
    });
  });

  describe('Css Options', () => {
    it('it sets the publicCssFileName', () => {
      jest.mock('fs-extra', () => {
        return {
          ensureDirSync: () => {},
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });

      // eslint-disable-next-line global-require
      const getConfig = require('../getConfig').default;

      expect(getConfig({ css: 'file' })).toStrictEqual(
        expect.objectContaining({
          ...output,
          $$internal: {
            ...output.$$internal,
            findComponent: expect.anything(),
            publicCssFileName: 'svelte-3449427d.css',
          },
        }),
      );
    });

    it('it throws an error on multiple css for publicCssFileName', () => {
      // eslint-disable-next-line global-require
      const getConfig = require('../getConfig').default;

      jest.mock('fs-extra', () => {
        return {
          ensureDirSync: () => {},
          readdirSync: () => ['svelte-3449427d.css', 'svelte-3449427213123.css', 'svelte.css-0050caf1.map'],
        };
      });

      expect(() => {
        getConfig({ css: 'file' });
      }).toThrow(/Race condition has caused multiple css/gim);
    });
  });
});
