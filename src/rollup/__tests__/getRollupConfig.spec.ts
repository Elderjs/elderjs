/* eslint-disable global-require */
import multiInput from 'rollup-plugin-multi-input';
import path from 'path';
import { createBrowserConfig, createSSRConfig } from '../getRollupConfig';
import getConfig from '../../utils/getConfig';

// TODO: test replace

const fixRelativePath = (arr) => {
  // eslint-disable-next-line no-param-reassign
  arr[0].output[0].file = arr[0].output[0].file.replace(process.cwd(), '');
  return arr;
};

jest.mock('fs-extra', () => {
  return {
    ensureDirSync: () => {},
    readdirSync: () => ['svelte-3449427d.css', 'svelte.css-0050caf1.map'],
  };
});

describe('#getRollupConfig', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const elderConfig = getConfig();

  it('createBrowserConfig works', () => {
    [true, false].forEach((sourcemap) => {
      const { plugins, ...config } = createBrowserConfig({
        input: [`./components/*/*.svelte`],
        output: {
          dir: './public/dist/svelte/',
          entryFileNames: '[name].[hash].js',
          sourcemap,
          format: 'system',
        },
        multiInputConfig: multiInput({
          // TODO: test with false
          relative: `./components`,
          transformOutputPath: (output) => `${path.basename(output)}`,
        }),
        svelteConfig: {},
        elderConfig,
      });
      expect(config).toEqual(
        expect.objectContaining({
          cache: true,
          input: ['./components/*/*.svelte'],
          output: {
            dir: './public/dist/svelte/',
            entryFileNames: '[name].[hash].js',
            format: 'system',
            sourcemap,
          },
          treeshake: true,
        }),
      );
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
        elderConfig,
      }).plugins.map((p) => p.name),
    ).toEqual(['replace', 'json', 'rollup-plugin-elder', 'node-resolve', 'commonjs', 'babel', 'terser']);
  });

  it('createBrowserConfig multiInputConfig = false, ie11 = true', () => {
    expect(
      createBrowserConfig({
        elderConfig,
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
    ).toEqual(['replace', 'json', 'rollup-plugin-elder', 'node-resolve', 'commonjs', 'babel', 'terser']);
  });

  it('createSSRConfig works', () => {
    const { plugins, ...config } = createSSRConfig({
      elderConfig,
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
    expect(config).toEqual(
      expect.objectContaining({
        cache: true,
        input: ['./components/*/*.svelte'],
        output: {
          dir: './___ELDER___/compiled/',
          exports: 'auto',
          format: 'cjs',
        },
        treeshake: true,
      }),
    );

    expect(plugins).toHaveLength(7);
  });

  it('createSSRConfig multiInputConfig = false', () => {
    expect(
      createSSRConfig({
        elderConfig,
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
    ).toEqual(['replace', 'json', 'rollup-plugin-elder', 'node-resolve', 'commonjs', 'terser']);
  });

  it('getRollupConfig as a whole works - default options', () => {
    jest.mock('../../utils/validations.ts', () => ({
      getDefaultRollup: () => ({
        replacements: {},
        dev: { splitComponents: false },
        svelteConfig: {},
      }),
    }));
    jest.mock('../../utils/getPluginLocations', () => () => ({
      paths: ['/src/plugins/elderjs-plugin-reload/'],
      files: [
        '/src/plugins/elderjs-plugin-reload/SimplePlugin.svelte',
        '/src/plugins/elderjs-plugin-reload/Test.svelte',
      ],
    }));
    // getElderConfig() mock
    jest.mock('../../utils/getConfig', () => () => ({
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

    const svelteConfig = {
      preprocess: [
        {
          style: ({ content }) => {
            return content.toUpperCase();
          },
        },
      ],
    };

    // would be nice to mock getPluginPaths if it's extracted to separate file
    const configs = fixRelativePath(require('../getRollupConfig').default({ svelteConfig }));
    expect(configs).toHaveLength(3);
  });
});
