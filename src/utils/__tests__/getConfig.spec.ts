const defaultConfig = { debug: { automagic: true }, locations: { buildFolder: '' } };
jest.mock('../tsConfigExist.ts', () => () => true);
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
    resolve: (...strings) => strings.join('/').replace('./', ''),
  };
});

process.cwd = () => 'test';

describe('#getConfig', () => {
  const output = {
    debug: {
      automagic: true,
    },
    locations: {
      buildFolder: './build/',
    },
    typescript: true,
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

  it('not able to set build folder from tsconfig', () => {
    jest.mock('fs', () => ({
      readFileSync: () =>
        JSON.stringify({
          compilerOptions: {
            outDir: '/build',
          },
        }),
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
