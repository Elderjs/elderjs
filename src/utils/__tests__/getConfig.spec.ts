import { describe, test, vi, expect, beforeEach } from 'vitest';
import { resolve } from 'path';
import getConfig, { getCssFile } from '../../utils/getConfig.js';

const defaultConfig = {
  debug: { build: false, hooks: false, performance: false, shortcodes: false, stacks: false },
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

vi.mock('../validations.ts', () => ({
  getDefaultConfig: () => defaultConfig,
}));

vi.mock('cosmiconfig', () => {
  return {
    cosmiconfigSync: () => ({
      search: () => ({ config: defaultConfig }),
    }),
  };
});

const output = {
  $$internal: {
    ssrComponents: resolve(process.cwd(), './___ELDER___/compiled'),
    clientComponents: resolve(process.cwd(), `./public/_elderjs/svelte`),
    distElder: resolve(process.cwd(), `./public/_elderjs`),
    // findComponent: () => {},
    logPrefix: '[Elder.js]:',
    serverPrefix: '',
  },
  build: false,
  debug: {
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
  prefix: '',
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

describe('#getConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('it accepts custom initalization options', () => {
    test('sets the expected default', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });

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
    vi.mock('fs-extra', () => {
      return {
        readJSONSync: () => ({ version: '1.2.3' }),
        ensureDirSync: () => '',
        existsSync: () => true,
        readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
      };
    });

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
      logPrefix: '[Elder.js]:',
    };

    test('gives back a custom context such as serverless', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
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

    test('sets a server without a prefix', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
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

    test('sets a server with a server.prefix without leading or trailing "/"', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', server: { prefix: 'testing' }, rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '/testing',
          },
          prefix: '/testing',
        }),
      );
      expect(r.$$internal).toMatchObject({
        ...common$$Internal,
        clientComponents: resolve(process.cwd(), `./t/public/testing/_elderjs/svelte`),
        distElder: resolve(process.cwd(), `./t/public/testing/_elderjs`),
      });
    });

    test('sets a server with a server.prefix with a trailing "/"', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', server: { prefix: 'testing/' }, rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '/testing',
          },
          prefix: '/testing',
        }),
      );
      expect(r.$$internal).toMatchObject({
        ...common$$Internal,
        clientComponents: resolve(process.cwd(), `./t/public/testing/_elderjs/svelte`),
        distElder: resolve(process.cwd(), `./t/public/testing/_elderjs`),
      });
    });

    test('sets a server with a server.prefix with a leading "/"', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', server: { prefix: '/testing' }, rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '/testing',
          },
          prefix: '/testing',
        }),
      );
      expect(r.$$internal).toMatchObject({
        ...common$$Internal,
        clientComponents: resolve(process.cwd(), `./t/public/testing/_elderjs/svelte`),
        distElder: resolve(process.cwd(), `./t/public/testing/_elderjs`),
      });
    });

    test('sets a server with a server.prefix with a leading and trailing "/"', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', server: { prefix: '/testing/' }, rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '/testing',
          },
          prefix: '/testing',
        }),
      );
      expect(r.$$internal).toMatchObject({
        ...common$$Internal,
        clientComponents: resolve(process.cwd(), `./t/public/testing/_elderjs/svelte`),
        distElder: resolve(process.cwd(), `./t/public/testing/_elderjs`),
      });
    });

    test('sets a server with a prefix without a leading or trailing "/"', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', prefix: 'testing', rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '/testing',
          },
          prefix: '/testing',
        }),
      );
      expect(r.$$internal).toMatchObject({
        ...common$$Internal,
        clientComponents: resolve(process.cwd(), `./t/public/testing/_elderjs/svelte`),
        distElder: resolve(process.cwd(), `./t/public/testing/_elderjs`),
      });
    });

    test('sets a server with a prefix with a leading "/"', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', prefix: '/testing', rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '/testing',
          },
          prefix: '/testing',
        }),
      );
      expect(r.$$internal).toMatchObject({
        ...common$$Internal,
        clientComponents: resolve(process.cwd(), `./t/public/testing/_elderjs/svelte`),
        distElder: resolve(process.cwd(), `./t/public/testing/_elderjs`),
      });
    });

    test('sets a server with a prefix with a trailing "/"', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', prefix: '/testing/', rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '/testing',
          },
          prefix: '/testing',
        }),
      );
      expect(r.$$internal).toMatchObject({
        ...common$$Internal,
        clientComponents: resolve(process.cwd(), `./t/public/testing/_elderjs/svelte`),
        distElder: resolve(process.cwd(), `./t/public/testing/_elderjs`),
      });
    });

    test('sets a server with a prefix with a leading and trailing "/"', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
          readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
        };
      });
      const r = getConfig({ context: 'server', prefix: '/testing/', rootDir: 't' });
      expect(r).toStrictEqual(
        expect.objectContaining({
          ...common,
          context: 'server',
          server: {
            prefix: '/testing',
          },
          prefix: '/testing',
        }),
      );
      expect(r.$$internal).toMatchObject({
        ...common$$Internal,
        clientComponents: resolve(process.cwd(), `./t/public/testing/_elderjs/svelte`),
        distElder: resolve(process.cwd(), `./t/public/testing/_elderjs`),
      });
    });

    test('sets build with default', () => {
      vi.mock('fs-extra', () => {
        return {
          readJSONSync: () => ({ version: '1.2.3' }),
          ensureDirSync: () => '',
          existsSync: () => true,
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
  test('sets the publicCssFile', () => {
    vi.mock('fs-extra', () => {
      return {
        readJSONSync: () => ({ version: '1.2.3' }),
        ensureDirSync: () => '',
        existsSync: () => true,
        readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
      };
    });

    expect(getConfig({ css: 'file' })).toStrictEqual(
      expect.objectContaining({
        ...output,
        $$internal: {
          ...output.$$internal,
          findComponent: expect.anything(),
          publicCssFile: expect.stringContaining('svelte-3449427d.css'),
        },
      }),
    );
  });
});

describe('Css Options', () => {
  test('throws an error on multiple css for publicCssFile', () => {
    const config = getConfig({ css: 'file' });

    expect(() => {
      getCssFile({ cssFiles: ['one.css', 'two.css'], serverPrefix: 'test', assetPath: 'test', config });
    }).toThrow(/Race condition has caused multiple css/gim);
  });
});
