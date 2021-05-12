/* eslint-disable global-require */

describe('#getPluginLocations', () => {
  const path = require('path');
  it('getPluginPaths works', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [
          '/src/plugins/elderjs-plugin-reload/SimplePlugin.svelte',
          '/src/plugins/elderjs-plugin-reload/Test.svelte',
        ])
        .mockImplementationOnce(() => ['/node_modules/@elderjs/plugin-browser-reload/Test.svelte']),
    }));

    jest.mock('fs-extra', () => ({
      existsSync: jest.fn().mockImplementation((filepath: string) => {
        if (
          filepath.endsWith('src/plugins/@elderjs/plugin-browser-reload/index.js') ||
          filepath.endsWith('src/plugins/@elderjs/plugin-browser-reload/index.ts')
        ) {
          return false;
        }

        if (filepath.endsWith('src/plugins/elderjs-plugin-reload/index.js')) {
          return false;
        }

        if (filepath.endsWith('src/plugins/elderjs-plugin-reload/index.ts')) {
          return true;
        }

        if (filepath.endsWith('node_modules/@elderjs/plugin-browser-reload/package.json')) {
          return true;
        }

        if (filepath.endsWith('node_modules/elderjs-plugin-reload/package.json')) {
          return false;
        }

        return jest.requireActual('fs-extra').existsSync(path);
      }),
    }));

    expect(
      // @ts-ignore
      require('../getPluginLocations').default({
        srcDir: './src',
        rootDir: './',
        plugins: {
          'elderjs-plugin-reload': {},
          '@elderjs/plugin-browser-reload': {},
        },
      }),
    ).toEqual({
      paths: [
        `${path.resolve('./src/plugins/elderjs-plugin-reload/')}/`,
        `${path.resolve('./node_modules/@elderjs/plugin-browser-reload/')}/`,
      ],
      files: [
        '/src/plugins/elderjs-plugin-reload/SimplePlugin.svelte',
        '/src/plugins/elderjs-plugin-reload/Test.svelte',
        '/node_modules/@elderjs/plugin-browser-reload/Test.svelte',
      ],
    });
  });
});
