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
      existsSync: jest
        .fn()
        .mockImplementationOnce(() => true) // first plugin from src
        .mockImplementationOnce(() => false) // 2nd from node modules
        .mockImplementationOnce(() => true),
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
