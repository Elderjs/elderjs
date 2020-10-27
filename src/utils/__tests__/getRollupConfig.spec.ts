/* eslint-disable global-require */
import multiInput from 'rollup-plugin-multi-input';
import path from 'path';
import { createBrowserConfig, createSSRConfig } from '../getRollupConfig';

// TODO: test replace

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
    ).toEqual(['replace', 'json', 'svelte', 'node-resolve', 'commonjs', 'elderjs-handle-css', 'terser']);
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

  it('getRollupConfig - throws error if intersection-observer doesnt exist', () => {
    jest.mock('../validations.ts', () => ({
      getDefaultRollup: () => ({}),
    }));
    jest.mock('path', () => ({
      resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
      posix: () => ({ dirname: () => '' }),
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
        .mockImplementationOnce(() => ['pluginAComponent1.svelte', 'pluginAComponent2.svelte', 'AnythingCanBeHere']) // getPluginPaths
        .mockImplementationOnce(() => ['pluginBComponent1.svelte', 'pluginBComponent2.svelte', 'AnythingCanBeHere']), // getPluginPaths
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
    const configs = require('../getRollupConfig').default({ svelteConfig });
    expect(configs).toHaveLength(8);
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

    jest.mock('path', () => ({
      resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
      posix: () => ({ dirname: () => '' }),
      parse: (str) => {
        const split = str.split('/');
        return split[split.length - 1].split('.')[0];
      },
    }));
    jest.mock('del');
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
    const configs = require('../getRollupConfig').default({ svelteConfig });
    expect(configs).toHaveLength(14);
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

    jest.mock('path', () => ({
      resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').replace('/./', '/'),
      posix: () => ({ dirname: () => '' }),
      parse: (str) => {
        const split = str.split('/');
        return split[split.length - 1].split('.')[0];
      },
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

    const configs = require('../getRollupConfig').default({ svelteConfig });
    expect(configs).toHaveLength(15);
    expect(configs).toMatchSnapshot();
  });
});
