/* eslint-disable global-require */
import multiInput from 'rollup-plugin-multi-input';
import path from 'path';
import { createBrowserConfig, createSSRConfig } from '../getRollupConfig';

describe('#getRollupConfig', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('createBrowserConfig works', () => {
    [true, false].forEach((sourcemap) => {
      expect(
        createBrowserConfig({
          input: [`./components/*/*.svelte`],
          output: {
            dir: './public/dist/svelte/',
            entryFileNames: 'entry[name]-[hash].js',
            sourcemap,
            format: 'system',
          },
          multiInputConfig: multiInput({
            // TODO: test with false
            relative: `./components`,
            transformOutputPath: (output) => `${path.basename(output)}`,
          }),
          svelteConfig: {},
        }),
      ).toEqual({
        cache: true,
        input: ['./components/*/*.svelte'],
        output: {
          dir: './public/dist/svelte/',
          entryFileNames: 'entry[name]-[hash].js',
          format: 'system',
          sourcemap,
        },
        plugins: [
          {
            options: expect.any(Function),
            pluginName: 'rollup-plugin-multi-input',
          },
          {
            name: 'replace',
            renderChunk: expect.any(Function),
            transform: expect.any(Function),
          },
          {
            name: 'json',
            transform: expect.any(Function),
          },
          {
            generateBundle: expect.any(Function),
            load: expect.any(Function),
            name: 'svelte',
            resolveId: expect.any(Function),
            transform: expect.any(Function),
          },
          {
            name: 'rollup-plugin-external-globals',
            transform: expect.any(Function),
          },
          {
            buildStart: expect.any(Function),
            generateBundle: expect.any(Function),
            getPackageInfoForId: expect.any(Function),
            load: expect.any(Function),
            name: 'node-resolve',
            resolveId: expect.any(Function),
          },
          {
            buildStart: expect.any(Function),
            load: expect.any(Function),
            name: 'commonjs',
            resolveId: expect.any(Function),
            transform: expect.any(Function),
          },
          {
            load: expect.any(Function),
            name: 'babel',
            resolveId: expect.any(Function),
            transform: expect.any(Function),
          },
          {
            name: 'terser',
            renderChunk: expect.any(Function),
          },
        ],
        treeshake: true,
      });
    });
  });

  it('createBrowserConfig multiInputConfig = false', () => {
    expect(
      createBrowserConfig({
        input: [`./components/*/*.svelte`],
        output: {
          dir: './public/dist/svelte/',
          entryFileNames: 'entry[name]-[hash].js',
          sourcemap: true,
          format: 'system',
        },
        svelteConfig: {},
      }).plugins,
    ).toEqual([
      {
        name: 'replace',
        renderChunk: expect.any(Function),
        transform: expect.any(Function),
      },
      {
        name: 'json',
        transform: expect.any(Function),
      },
      {
        generateBundle: expect.any(Function),
        load: expect.any(Function),
        name: 'svelte',
        resolveId: expect.any(Function),
        transform: expect.any(Function),
      },
      {
        name: 'rollup-plugin-external-globals',
        transform: expect.any(Function),
      },
      {
        buildStart: expect.any(Function),
        generateBundle: expect.any(Function),
        getPackageInfoForId: expect.any(Function),
        load: expect.any(Function),
        name: 'node-resolve',
        resolveId: expect.any(Function),
      },
      {
        buildStart: expect.any(Function),
        load: expect.any(Function),
        name: 'commonjs',
        resolveId: expect.any(Function),
        transform: expect.any(Function),
      },
      {
        load: expect.any(Function),
        name: 'babel',
        resolveId: expect.any(Function),
        transform: expect.any(Function),
      },
      {
        name: 'terser',
        renderChunk: expect.any(Function),
      },
    ]);
  });

  it('createSSRConfig works', () => {
    expect(
      createSSRConfig({
        input: [`./components/*/*.svelte`],
        output: {
          dir: './___ELDER___/compiled/',
          format: 'cjs',
          exports: 'auto',
        },
        multiInputConfig: multiInput({
          relative: `./components`,
          transformOutputPath: (output) => `${path.basename(output)}`,
        }),
        svelteConfig: {
          preprocess: [
            {
              style: ({ content }) => {
                return content.toUpperCase();
              },
            },
          ],
        },
      }),
    ).toEqual({
      cache: true,
      input: ['./components/*/*.svelte'],
      output: {
        dir: './___ELDER___/compiled/',
        exports: 'auto',
        format: 'cjs',
      },
      plugins: [
        {
          options: expect.any(Function),
          pluginName: 'rollup-plugin-multi-input',
        },
        {
          name: 'replace',
          renderChunk: expect.any(Function),
          transform: expect.any(Function),
        },
        {
          name: 'json',
          transform: expect.any(Function),
        },
        {
          generateBundle: expect.any(Function),
          load: expect.any(Function),
          name: 'svelte',
          resolveId: expect.any(Function),
          transform: expect.any(Function),
        },
        {
          buildStart: expect.any(Function),
          generateBundle: expect.any(Function),
          getPackageInfoForId: expect.any(Function),
          load: expect.any(Function),
          name: 'node-resolve',
          resolveId: expect.any(Function),
        },
        {
          buildStart: expect.any(Function),
          load: expect.any(Function),
          name: 'commonjs',
          resolveId: expect.any(Function),
          transform: expect.any(Function),
        },
        {
          generateBundle: expect.any(Function),
          name: 'css',
          transform: expect.any(Function),
        },
        {
          name: 'terser',
          renderChunk: expect.any(Function),
        },
      ],
      treeshake: true,
    });
  });

  it('createSSRConfig multiInputConfig = false', () => {
    expect(
      createSSRConfig({
        input: [`./components/*/*.svelte`],
        output: {
          dir: './___ELDER___/compiled/',
          format: 'cjs',
          exports: 'auto',
        },
        svelteConfig: {
          preprocess: [
            {
              style: ({ content }) => {
                return content.toUpperCase();
              },
            },
          ],
        },
      }).plugins,
    ).toEqual([
      {
        name: 'replace',
        renderChunk: expect.any(Function),
        transform: expect.any(Function),
      },
      {
        name: 'json',
        transform: expect.any(Function),
      },
      {
        generateBundle: expect.any(Function),
        load: expect.any(Function),
        name: 'svelte',
        resolveId: expect.any(Function),
        transform: expect.any(Function),
      },
      {
        buildStart: expect.any(Function),
        generateBundle: expect.any(Function),
        getPackageInfoForId: expect.any(Function),
        load: expect.any(Function),
        name: 'node-resolve',
        resolveId: expect.any(Function),
      },
      {
        buildStart: expect.any(Function),
        load: expect.any(Function),
        name: 'commonjs',
        resolveId: expect.any(Function),
        transform: expect.any(Function),
      },
      {
        generateBundle: expect.any(Function),
        name: 'css',
        transform: expect.any(Function),
      },
      {
        name: 'terser',
        renderChunk: expect.any(Function),
      },
    ]);
  });

  it('getPluginPaths works', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => ['a-file1.svelte', 'a-file2.svelte'])
        .mockImplementationOnce(() => ['b-file1.svelte', 'b-file2.svelte']),
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
      require('../getRollupConfig').getPluginPaths({
        srcDir: './src',
        rootDir: './',
        plugins: {
          pluginA: {},
          pluginB: {},
        },
      }),
    ).toEqual([process.cwd() + '/src/plugins/pluginA/', process.cwd() + '/node_modules/pluginB/']);
  });

  it('getRollupConfig as a whole works', () => {
    jest.mock('../getConfig', () => () => ({
      $$internal: {
        clientComponents: 'test/public/svelte',
        ssrComponents: 'test/___ELDER___/compiled',
      },
      distDir: './dist',
      srcDir: './src',
      rootDir: './',
      plugins: {
        pluginA: {},
        pluginB: {},
      },
    }));

    jest.mock('del');
    jest.mock('fs-extra', () => ({
      existsSync: jest.fn().mockImplementation(() => true),
    }));
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => ['route1.svelte', 'route2.svelte'])
        .mockImplementationOnce(() => ['layout1.svelte', 'layout2.svelte'])
        .mockImplementationOnce(() => ['pluginA.svelte', 'pluginB.svelte'])
        .mockImplementationOnce(() => ['foo.svelte', 'bar.svelte']),
    }));

    const svelteConfig = {
      preprocess: [
        {
          style: ({ content }) => {
            return content.toUpperCase();
          },
        },
      ],
    };
    expect(require('../getRollupConfig').default({ svelteConfig })).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          input: './node_modules/intersection-observer/intersection-observer.js',
        }),
      ]),
    );
  });
});
