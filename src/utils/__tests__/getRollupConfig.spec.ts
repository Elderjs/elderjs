/* eslint-disable global-require */
import multiInput from 'rollup-plugin-multi-input';
import path from 'path';
import { createBrowserConfig, createSSRConfig } from '../getRollupConfig';

// TODO: test replace

const fixRelativePath = (arr) => {
  arr[0].output[0].file = arr[0].output[0].file.replace(process.cwd(), '');
  return arr;
};

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

  it('createBrowserConfig multiInputConfig = false, ie11 = true', () => {
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
        ie11: true,
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
      rootDir: 'test',
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
        rootDir: 'test',
        multiInputConfig: false,
      }).plugins.map((p) => p.name),
    ).toEqual(['replace', 'json', 'svelte', 'node-resolve', 'commonjs', 'elderjs-handle-css', 'terser']);
  });

  it('getRollupConfig - throws error if intersection-observer doesnt exist', () => {
    jest.mock('../validations.ts', () => ({
      getDefaultRollup: () => ({}),
    }));

    jest.mock('del');
    // getElderConfig() mock
    jest.mock('../getConfig', () => () => ({
      $$internal: {
        clientComponents: 'test/public/svelte',
        ssrComponents: 'test/___ELDER___/compiled',
      },
      distDir: './dist',
      srcDir: './src',
      rootDir: './',
      plugins: {},
      legacy: false,
    }));
    jest.mock('fs-extra', () => ({
      existsSync: jest.fn().mockImplementationOnce(() => false),
    }));
    expect(() => require('../getRollupConfig').default()).toThrow(
      `Elder.js peer dependency not found at ./node_modules/intersection-observer/intersection-observer.js`,
    );
  });

  it('getRollupConfig as a whole works - default options', () => {
    jest.mock('../validations.ts', () => ({
      getDefaultRollup: () => ({
        replacements: {},
        dev: { splitComponents: false },
        svelteConfig: {},
      }),
    }));
    jest.mock('../getPluginLocations', () => () => ({
      paths: ['/src/plugins/elderjs-plugin-reload/'],
      files: [
        '/src/plugins/elderjs-plugin-reload/SimplePlugin.svelte',
        '/src/plugins/elderjs-plugin-reload/Test.svelte',
      ],
    }));
    // getElderConfig() mock
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
      legacy: false,
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
    expect(configs).toMatchSnapshot();
  });

  it('getRollupConfig as a whole works - legacy: true', () => {
    jest.mock('../validations.ts', () => ({
      getDefaultRollup: () => ({
        replacements: {},
        dev: { splitComponents: false },
        svelteConfig: {},
      }),
    }));
    jest.mock('../getPluginLocations', () => () => ({
      paths: ['/src/plugins/elderjs-plugin-reload/'],
      files: [
        '/src/plugins/elderjs-plugin-reload/SimplePlugin.svelte',
        '/src/plugins/elderjs-plugin-reload/Test.svelte',
      ],
    }));
    // getElderConfig() mock
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
      legacy: true,
    }));

    jest.mock('fs-extra', () => ({
      existsSync: jest.fn().mockImplementation(() => true),
    }));
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => ['pluginAComponent1.svelte', 'pluginAComponent2.svelte', 'AnythingCanBeHere']) // getPluginPaths
        .mockImplementationOnce(() => ['pluginBComponent1.svelte', 'pluginBComponent2.svelte', 'AnythingCanBeHere']) // getPluginPaths
        .mockImplementationOnce(() => ['NestedSrcComponent.svelte']) // nested
        .mockImplementationOnce(() => ['SrcComponent.svlete', 'SrcComponent2.svelte']) // src
        .mockImplementationOnce(() => ['LegacyPluginAComponent3.svelte', 'LegacyPluginAComponent4.svelte']) // legacy pluginA components
        .mockImplementationOnce(() => ['LegacyPluginBComponent3.svelte']), // legacy pluginB components
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
    expect(configs).toHaveLength(10);
    expect(configs).toMatchSnapshot();
  });

  it('getRollupConfig as a whole works - splitComponents: true, legacy: true', () => {
    process.env.ROLLUP_WATCH = 'true'; // for production to be false
    jest.mock('../validations.ts', () => ({
      getDefaultRollup: () => ({
        replacements: {},
        dev: { splitComponents: true },
        svelteConfig: {},
      }),
    }));
    jest.mock('../getPluginLocations', () => () => ({
      paths: ['/src/plugins/elderjs-plugin-reload/'],
      files: [
        '/src/plugins/elderjs-plugin-reload/SimplePlugin.svelte',
        '/src/plugins/elderjs-plugin-reload/Test.svelte',
      ],
    }));
    // getElderConfig() mock
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
      legacy: true,
    }));

    jest.mock('del');
    jest.mock('fs-extra', () => ({
      existsSync: jest.fn().mockImplementation(() => true),
    }));
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        // mock folder file contents - exact order matters
        .mockImplementationOnce(() => ['pluginAComponent1.svelte', 'pluginAComponent2.svelte']) // getPluginPaths
        .mockImplementationOnce(() => ['pluginBComponent1.svelte', 'pluginBComponent2.svelte']) // getPluginPaths
        .mockImplementationOnce(() => ['NestedSrcComponent.svelte']) // srcComponentsNested
        .mockImplementationOnce(() => ['SrcComponent.svelte', 'SrcComponent2.svelte']) // srcComponents
        .mockImplementationOnce(() => ['LegacyPluginAComponent1.svelte', 'LegacyPluginAComponent2.svelte']) // legacy pluginA components
        .mockImplementationOnce(() => ['LegacyPluginBComponent1.svelte']), // legacy pluginB components
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

    const configs = fixRelativePath(require('../getRollupConfig').default({ svelteConfig }));
    expect(configs).toHaveLength(8);
    expect(configs).toMatchSnapshot();

    expect(fixRelativePath(require('../getRollupConfig').default({ svelteConfig }))).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          input: './node_modules/intersection-observer/intersection-observer.js',
        }),
      ]),
    );
  });
});
