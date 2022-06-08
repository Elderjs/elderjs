import path from 'path';

const findComponent = () => ({ ssr: true, client: true, iife: undefined });

const perf = {
  start: () => {},
  end: () => {},
};

describe('#plugins', () => {
  beforeEach(() => jest.resetModules());

  describe('#pluginVersionCheck', () => {
    // eslint-disable-next-line global-require
    const { pluginVersionCheck } = require('../index');
    it('Returns false: Elder v1.4.13 < Required v1.4.14', () => {
      expect(pluginVersionCheck('1.4.13', '1.4.14')).toBe(false);
    });

    it('Returns false: Elder v1.4.13 < Required v5.4.14', () => {
      expect(pluginVersionCheck('1.4.13', '5.4.14')).toBe(false);
    });

    it('Returns true: Elder v1.4.14 > Required v1.4.13', () => {
      expect(pluginVersionCheck('1.4.14', '1.4.13')).toBe(true);
    });
    it('Returns true: Elder v1.4.14 = Required v1.4.14', () => {
      expect(pluginVersionCheck('1.4.14', '1.4.14')).toBe(true);
    });
    it('Returns true: Elder v2.0.0 > Required v1.4.14', () => {
      expect(pluginVersionCheck('2.0.0', '1.4.14')).toBe(true);
    });
  });

  it('no plugins in settings', async () => {
    // eslint-disable-next-line global-require
    const plugins = require('../index').default;
    const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins({
      perf,
      settings: {
        plugins: {},
        srcDir: 'test/src',
        rootDir: 'test',
        // @ts-ignore
        $$internal: { ssrComponents: 'test/___ELDER___/compiled', findComponent },
      },
    });
    expect(pluginRoutes).toEqual({});
    expect(pluginHooks).toEqual([]);
    expect(pluginShortcodes).toEqual([]);
  });

  it('plugin not found in plugins or node_modules folder, skipping', async () => {
    jest.mock('fs-extra', () => ({
      existsSync: () => false,
    }));
    // eslint-disable-next-line global-require
    const plugins = require('../index').default;
    const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins({
      perf,
      settings: {
        plugins: {
          'elder-plugin-upload-s3': {
            dataBucket: 'elderguide.com',
            htmlBucket: 'elderguide.com',
            deployId: '11111111',
          },
        },
        srcDir: 'test/src',
        rootDir: 'test',
        // @ts-ignore
        $$internal: { ssrComponents: 'test/___ELDER___/compiled', findComponent },
      },
    });
    expect(pluginRoutes).toEqual({});
    expect(pluginHooks).toEqual([]);
    expect(pluginShortcodes).toEqual([]);
  });

  it('plugin file found in node modules, but is empty, skipping', async () => {
    jest.mock('fs-extra', () => ({
      existsSync: () => true,
    }));
    jest.mock(path.resolve(`./test/src/plugins/elder-plugin-upload-s3/index.js`), () => '', {
      virtual: true,
    });
    jest.mock(path.resolve(`./test/node_modules/elder-plugin-upload-s3/package.json`), () => ({ main: './index.js' }), {
      virtual: true,
    });
    jest.mock(path.resolve(`./test/node_modules/elder-plugin-upload-s3/index.js`), () => '', {
      virtual: true,
    });
    // eslint-disable-next-line global-require
    const plugins = require('../index').default;
    const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins({
      perf,
      settings: {
        plugins: {
          'elder-plugin-upload-s3': {
            dataBucket: 'elderguide.com',
            htmlBucket: 'elderguide.com',
            deployId: '11111111',
          },
        },
        srcDir: 'test/src',
        rootDir: 'test',
        // @ts-ignore
        $$internal: { ssrComponents: 'test/___ELDER___/compiled', findComponent },
      },
    });
    expect(pluginRoutes).toEqual({});
    expect(pluginHooks).toEqual([]);
    expect(pluginShortcodes).toEqual([]);
  });

  it('plugin file found but is invalid', async () => {
    jest.mock('../../utils/validations', () => ({
      validatePlugin: () => false,
      validateShortcode: (i) => i,
    }));
    jest.mock('fs-extra', () => ({
      existsSync: () => true,
    }));
    const initMock = jest.fn().mockImplementation((p) => Promise.resolve(p));
    jest.mock(
      path.resolve(`./test/src/plugins/elder-plugin-upload-s3/index.js`),
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
        init: initMock,
      }),
      {
        virtual: true,
      },
    );
    // eslint-disable-next-line global-require
    const plugins = require('../index').default;
    const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins({
      perf,
      settings: {
        plugins: {
          'elder-plugin-upload-s3': {
            dataBucket: 'elderguide.com',
            htmlBucket: 'elderguide.com',
            deployId: '11111111',
          },
        },
        srcDir: 'test/src',
        rootDir: 'test',
        // @ts-ignore
        $$internal: { ssrComponents: 'test/___ELDER___/compiled', findComponent },
      },
    });
    expect(pluginRoutes).toEqual({});
    expect(pluginHooks).toEqual([]);
    expect(pluginShortcodes).toEqual([]);
    expect(initMock).toHaveBeenCalled();
  });

  it('plugin has routes, hooks and shortcodes', async () => {
    jest.mock(path.resolve(`./src/utils/validations`), () => ({
      validatePlugin: (i) => i,
      validateHook: () => ({ priority: 50 }),
      validateShortcode: (i) => i,
    }));
    jest.mock('fs-extra', () => ({
      existsSync: () => true,
    }));
    const initMock = jest.fn().mockImplementation((p) => Promise.resolve(p));
    jest.mock(
      path.resolve(`./test/src/plugins/elder-plugin-upload-s3/index.js`),
      () => ({
        hooks: [
          {
            hook: 'customizeHooks',
            name: 'test hook',
            description: 'just for testing',
            priority: 50,
            run: jest.fn(),
          },
        ],
        routes: {
          routeA: {
            data: jest.fn(),
            template: 'template/routeA.svelte',
            layout: 'layout/routeA.svelte',
            permalink: () => '/',
          },
          routeB: {
            data: { foo: 'bar' },
            // no template defined
          },
        },
        shortcodes: [
          {
            shortcode: 'svelteComponent',
            run: () => {},
          },
        ],
        config: {},
        name: 'test',
        description: 'test',
        init: initMock,
      }),
      {
        virtual: true,
      },
    );
    // eslint-disable-next-line global-require
    const plugins = require('../index').default;
    const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins({
      perf,
      settings: {
        plugins: {
          'elder-plugin-upload-s3': {
            dataBucket: 'elderguide.com',
            htmlBucket: 'elderguide.com',
            deployId: '11111111',
          },
        },
        srcDir: 'test/src',
        rootDir: 'test',
        // @ts-ignore
        $$internal: { ssrComponents: 'test/___ELDER___/compiled', findComponent },
      },
    });

    expect(pluginRoutes).toEqual({
      routeA: {
        $$meta: {
          addedBy: 'elder-plugin-upload-s3',
          type: 'plugin',
        },
        data: expect.any(Function),
        layout: 'layout/routeA.svelte',
        layoutComponent: expect.any(Function),
        template: 'template/routeA.svelte',
        templateComponent: expect.any(Function),
        permalink: expect.any(Function),
      },
    });
    expect(pluginHooks).toEqual([
      {
        priority: 50,
        $$meta: {
          addedBy: 'elder-plugin-upload-s3',
          type: 'plugin',
        },
      },
    ]);
    expect(pluginShortcodes).toHaveLength(1);
    expect(initMock).toHaveBeenCalled();
  });
});
