import {
  validateRoute,
  validatePlugin,
  validateHook,
  getDefaultConfig,
  configSchema,
  hookSchema,
  routeSchema,
  pluginSchema,
} from '../validations';
import normalizeSnapshot from '../normalizeSnapshot';

describe('#validations', () => {
  const validHook = {
    hook: 'customizeHooks',
    name: 'test hook',
    description: 'just for testing',
    run: jest.fn(),
    $$meta: {
      type: 'hooks.js',
      addedBy: 'validations.spec.ts',
    },
  };

  const defaultConfig = {
    css: 'file',
    legacy: false,
    build: {
      numberOfWorkers: -1,
      shuffleRequests: false,
    },
    rootDir: 'process.cwd()',
    srcDir: 'src',
    distDir: 'public',
    debug: {
      automagic: false,
      build: false,
      hooks: false,
      performance: false,
      stacks: false,
      shortcodes: false,
    },
    hooks: {
      disable: [],
    },
    origin: '',
    lang: 'en',
    plugins: {},
    prefix: '',
    server: {
      prefix: '',
    },
    shortcodes: {
      closePattern: '}}',
      openPattern: '{{',
    },
  };
  test('getDefaultConfig', () => {
    expect(getDefaultConfig()).toEqual(defaultConfig);
  });
  test('validateHook', () => {
    expect(validateHook({})).toEqual(false);
    expect(validateHook(null)).toEqual(false);
    expect(validateHook(validHook)).toEqual({ ...validHook, priority: 50 });
    expect(validateHook({ ...validHook, priority: 10 })).toEqual({ ...validHook, priority: 10 });
    expect(validateHook({ ...validHook, hook: 'invalidHookName' })).toEqual(false);
  });
  test('validateRoute', () => {
    expect(validateRoute({}, 'invalid')).toEqual(false);
    expect(validateRoute(null, 'invalid')).toEqual(false);
    expect(
      validateRoute(
        {
          template: 'Home.svelte',
          permalink: jest.fn(),
        },
        'invalid',
      ),
    ).toEqual(false);
    const validRoute = {
      template: 'Home.svelte',
      all: jest.fn(),
      permalink: jest.fn(),
      hooks: [],
      data: {},
    };
    expect(validateRoute(validRoute, 'Home')).toEqual(validRoute);
    // works with valid hook
    expect(validateRoute({ ...validRoute, hooks: [validHook] }, 'Home')).toEqual({ ...validRoute, hooks: [validHook] });
    // but also invalid hook
    expect(validateRoute({ ...validRoute, hooks: ['a', 'b', 3] }, 'Home')).toEqual({
      ...validRoute,
      hooks: ['a', 'b', 3], // TODO: nested hook validation?
    });
  });
  test('validatePlugin', () => {
    expect(validatePlugin({})).toEqual(false);
    expect(validatePlugin(null)).toEqual(false);
    const validPlugin = {
      name: 'test plugin',
      description: 'just for testing',
      init: jest.fn(), // FIXME: init should be required or test should allow not defined
      hooks: [1, 2, 3], // TODO: nested hook validation?
      shortcodes: [],
    };
    expect(validatePlugin(validPlugin)).toEqual({ ...validPlugin, config: {}, routes: {} });
    expect(validatePlugin({ ...validPlugin, config: defaultConfig })).toEqual({
      ...validPlugin,
      config: defaultConfig,
      routes: {},
    });
  });
  test('configSchema', () => {
    expect(normalizeSnapshot(configSchema)).toMatchSnapshot();
  });
  test('hookSchema', () => {
    expect(normalizeSnapshot(hookSchema)).toMatchSnapshot();
  });
  test('routeSchema', () => {
    expect(normalizeSnapshot(routeSchema)).toMatchSnapshot();
  });
  test('pluginSchema', () => {
    expect(normalizeSnapshot(pluginSchema)).toMatchSnapshot();
  });
});
