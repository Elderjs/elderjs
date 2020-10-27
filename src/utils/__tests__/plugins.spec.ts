jest.mock('path', () => {
  return {
    resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
    join: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
    posix: () => ({ dirname: () => '' }),
  };
});

describe('#plugins', () => {
  beforeEach(() => jest.resetModules());
  it('no plugins in settings', async () => {
    // eslint-disable-next-line global-require
    const plugins = require('../plugins').default;
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
    const plugins = require('../plugins').default;
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
    jest.mock('test/src/plugins/elder-plugin-upload-s3/index.js', () => '', {
      virtual: true,
    });
    // jest.mock('test/__ELDER__/plugins/elder-plugin-upload-s3/index.js', () => '', {
    //   virtual: true,
    // });
    jest.mock('test/node_modules/elder-plugin-upload-s3/package.json', () => ({ main: './index.js' }), {
      virtual: true,
    });
    jest.mock('test/node_modules/elder-plugin-upload-s3/index.js', () => '', {
      virtual: true,
    });
    // eslint-disable-next-line global-require
    const plugins = require('../plugins').default;
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
    jest.mock('../validations', () => ({
      validatePlugin: () => false,
      validateShortcode: (i) => i,
    }));
    jest.mock('fs-extra', () => ({
      existsSync: () => true,
    }));
    const initMock = jest.fn().mockImplementation((p) => Promise.resolve(p));
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
        init: initMock,
      }),
      {
        virtual: true,
      },
    );
    // eslint-disable-next-line global-require
    const plugins = require('../plugins').default;
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
});
