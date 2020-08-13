import getConfig from '../getConfig';

jest.mock('../tsConfigExist.ts', () => () => true);
jest.mock('../validations.ts', () => ({
  getDefaultConfig: () => ({ debug: { automagic: false }, locations: { buildFolder: '' } }),
}));

jest.mock('cosmiconfig', () => {
  return {
    cosmiconfigSync: () => ({
      search: () => jest.fn(),
    }),
  };
});

jest.mock('path', () => {
  return {
    resolve: (...strings) => strings.join('/').replace('./', ''),
  };
});

jest.mock('fs', () => {
  return {
    statSync: (path) => {
      if (path.startsWith('test')) {
        throw new Error('');
      }
      return {};
    },
    readFileSync: () =>
      JSON.stringify({
        compilerOptions: {
          outDir: 'build',
        },
      }),
  };
});

process.cwd = () => 'test';

describe('#getConfig', () => {
  it('works', () => {
    const output = {
      debug: {
        automagic: false,
      },
      locations: {
        buildFolder: './build/',
      },
      typescript: true,
    };
    expect(getConfig()).toEqual(output);
    expect(getConfig('build')).toEqual(output);
    expect(getConfig('random')).toEqual(output);
  });
});
