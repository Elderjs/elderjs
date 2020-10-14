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
      const { plugins, ...config } = createBrowserConfig({
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
      });
      expect(config).toEqual({
        cache: true,
        input: ['./components/*/*.svelte'],
        output: {
          dir: './public/dist/svelte/',
          entryFileNames: 'entry[name]-[hash].js',
          format: 'system',
          sourcemap,
        },
        treeshake: true,
      });
      expect(plugins).toHaveLength(8);
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
        multiInputConfig: false,
      }).plugins.map((p) => p.name),
    ).toEqual(['replace', 'json', 'svelte', 'node-resolve', 'commonjs', 'babel', 'terser']);
  });

  it('createSSRConfig works', () => {
    const { plugins, ...config } = createSSRConfig({
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
    });
    expect(config).toEqual({
      cache: true,
      input: ['./components/*/*.svelte'],
      output: {
        dir: './___ELDER___/compiled/',
        exports: 'auto',
        format: 'cjs',
      },
      treeshake: true,
    });

    expect(plugins).toHaveLength(8);
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
        multiInputConfig: false,
      }).plugins.map((p) => p.name),
    ).toEqual(['replace', 'json', 'svelte', 'node-resolve', 'commonjs', 'css', 'terser']);
  });

  it('getPluginPaths works', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => ['a-file1.svelte', 'a-file2.svelte'])
        .mockImplementationOnce(() => ['b-file1.svelte', 'b-file2.svelte']),
    }));

    jest.mock('path', () => ({
      resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
      posix: () => ({ dirname: () => '' }),
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
    ).toEqual(['src/plugins/pluginA/', '/node_modules/pluginB/']);
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

    jest.mock('path', () => ({
      resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
      posix: () => ({ dirname: () => '' }),
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
    expect(require('../getRollupConfig').default({ svelteConfig })).toMatchSnapshot();
  });
});
