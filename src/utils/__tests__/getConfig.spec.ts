const defaultConfig = { legacy: true, debug: { automagic: true }, distDir: 'public', srcDir: 'src', rootDir: 'test' };
jest.mock('../validations.ts', () => ({
  getDefaultConfig: () => defaultConfig,
}));

jest.mock('cosmiconfig', () => {
  return {
    cosmiconfigSync: () => ({
      search: () => ({ config: defaultConfig }),
    }),
  };
});

jest.mock('path', () => {
  return {
    resolve: (...strings) => strings.join('/').replace('./', '').replace('test/test', 'test'),
  };
});

process.cwd = () => 'test';

describe('#getConfig', () => {
  const output = {
    $$internal: {
      clientComponents: 'test/public/svelte/',
      ssrComponents: 'test/___ELDER___/compiled/',
    },
    debug: {
      automagic: true,
    },
    distDir: 'test/public',
    rootDir: 'test',
    srcDir: 'test/src',
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it('throws but is catched, fallbacks to default', () => {
    jest.mock('fs', () => ({
      readFileSync: () => {
        throw new Error();
      },
    }));
    // eslint-disable-next-line global-require
    const getConfig = require('../getConfig').default;

    expect(getConfig()).toEqual(defaultConfig);
  });

  it('works', () => {
    jest.mock('fs', () => ({
      readFileSync: () =>
        JSON.stringify({
          compilerOptions: {
            outDir: 'build',
          },
        }),
    }));

    // eslint-disable-next-line global-require
    const getConfig = require('../getConfig').default;

    expect(getConfig('debug')).toEqual(output);
    expect(getConfig('build')).toEqual(output);
    expect(getConfig('random')).toEqual(output);
  });
});
