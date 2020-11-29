import path from 'path';

describe('#plugins', () => {
  beforeEach(() => jest.resetModules());
  it('no plugins in settings', async () => {
    // eslint-disable-next-line global-require
    const plugins = require('../index').default;
    const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins({
      settings: {
        plugins: {},
        srcDir: 'test/src',
        rootDir: 'test',
        // @ts-ignore
        $$internal: { ssrComponents: 'test/___ELDER___/compiled' },
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
        $$internal: { ssrComponents: 'test/___ELDER___/compiled' },
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
        $$internal: { ssrComponents: 'test/___ELDER___/compiled' },
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
        $$internal: { ssrComponents: 'test/___ELDER___/compiled' },
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
      validateHook: () => true,
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
        routes: {
          routeA: {
            data: jest.fn(),
            template: 'template/routeA.svelte',
            layout: 'layout/routeA.svelte',
          },
          routeB: {
            hooks: [], // not supported warning
            data: { foo: 'bar' },
            // no template defined
          },
        },
        shortcodes: [
          {
            shortcode: 'svelteComponent',
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
        $$internal: { ssrComponents: 'test/___ELDER___/compiled' },
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
      },
    });
    expect(pluginHooks).toEqual([true]);
    expect(pluginShortcodes).toEqual([
      {
        $$meta: {
          addedBy: 'elder-plugin-upload-s3',
          type: 'plugin',
        },
        plugin: {
          config: {
            dataBucket: 'elderguide.com',
            deployId: '11111111',
            htmlBucket: 'elderguide.com',
          },
          description: 'test',
          hooks: [
            {
              $$meta: {
                addedBy: 'validations.spec.ts',
                type: 'hooks.js',
              },
              description: 'just for testing',
              hook: 'customizeHooks',
              name: 'test hook',
              run: expect.any(Function),
            },
          ],
          name: 'test',
          routes: {
            routeA: {
              data: expect.any(Function),
              layout: 'layout/routeA.svelte',
              layoutComponent: expect.any(Function),
              template: 'template/routeA.svelte',
              templateComponent: expect.any(Function),
            },
            routeB: {
              data: {
                foo: 'bar',
              },
              hooks: [],
            },
          },
          settings: {
            $$internal: {
              ssrComponents: 'test/___ELDER___/compiled',
            },
            plugins: {
              'elder-plugin-upload-s3': {
                dataBucket: 'elderguide.com',
                deployId: '11111111',
                htmlBucket: 'elderguide.com',
              },
            },
            rootDir: 'test',
            srcDir: 'test/src',
          },
          shortcodes: [expect.anything()],
        },
        shortcode: 'svelteComponent',
      },
    ]);
    expect(initMock).toHaveBeenCalled();
  });
});
