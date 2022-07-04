import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
// vi.resetModules();

import path from 'path';
import getPluginLocations from '../getPluginLocations';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

// vi.mock('fs-extra', () => {
//   return {
//     readJSONSync: () => ({ version: '1.2.3' }),
//     ensureDirSync: () => '',
//     existsSync: () => true,
//     readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
//   };
// });

vi.mock('fast-glob', () => {
  return {
    default: {
      sync: vi
        .fn()
        .mockImplementationOnce(() => [
          '/src/plugins/elderjs-plugin-reload/SimplePlugin.svelte',
          '/src/plugins/elderjs-plugin-reload/Test.svelte',
        ])
        .mockImplementationOnce(() => ['/node_modules/@elderjs/plugin-browser-reload/Test.svelte']),
    },
  };
});

vi.mock('fs-extra', () => {
  return {
    default: {
      existsSync: vi
        .fn(() => true)
        .mockImplementationOnce(() => true) // first plugin from src
        .mockImplementationOnce(() => false) // 2nd from node modules
        .mockImplementationOnce(() => true),
    },
  };
});

describe('#getPluginLocations', () => {
  it('getPluginPaths works', () => {
    const r = getPluginLocations({
      srcDir: './src',
      rootDir: './',
      plugins: {
        'elderjs-plugin-reload': {},
        '@elderjs/plugin-browser-reload': {},
      },
    });

    expect(r).toEqual({
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
