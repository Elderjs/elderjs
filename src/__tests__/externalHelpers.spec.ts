process.cwd = () => 'test';

const settings = {
  debug: {
    automagic: true,
  },
  srcDir: './src/',
};
const query = {};

class StatSyncError extends Error {
  code: 'ENOENT';

  constructor(msg: string) {
    super(msg);
    this.code = 'ENOENT';
  }
}

describe('#externalHelpers', () => {
  beforeEach(() => jest.resetModules());
  it('throws', async () => {
    jest.mock('fs', () => ({
      statSync: jest.fn(() => {
        throw new StatSyncError('no file');
      }),
    }));
    // eslint-disable-next-line global-require
    const externalHelpers = require('../externalHelpers').default;
    // @ts-ignore
    expect(await externalHelpers({ settings, query, helpers: [] })).toEqual(undefined);
    const modifiedSettings = {
      ...settings,
      debug: { automagic: false },
      srcDir: '',
    };
    expect(
      await externalHelpers({
        settings: modifiedSettings,
        query,
        helpers: [],
      }),
    ).toEqual(undefined);
  });
  it('returns undefined if file is not there', async () => {
    jest.mock('fs', () => ({
      statSync: jest.fn().mockImplementationOnce(() => {
        throw new Error('');
      }),
    }));
    // eslint-disable-next-line global-require
    const externalHelpers = require('../externalHelpers').default;
    // @ts-ignore
    expect(await externalHelpers({ settings, query, helpers: [] })).toBe(undefined);
  });
  it('works - userHelpers is not a function', async () => {
    jest.mock(
      'src/helpers/index.js',
      () => ({
        userHelper: () => 'something',
      }),
      { virtual: true },
    );
    jest.mock('fs', () => ({
      statSync: jest.fn().mockImplementationOnce(() => {}),
    }));
    // eslint-disable-next-line global-require
    const externalHelpers = require('../externalHelpers').default;
    // @ts-ignore
    expect(await externalHelpers({ settings, query, helpers: [] })).toMatchSnapshot();
    // from cache
    // @ts-ignore
    expect(await externalHelpers({ settings, query, helpers: [] })).toMatchSnapshot();
  });
  it('works - userHelpers is a function', async () => {
    jest.mock(
      'src/helpers/index.js',
      () => () =>
        Promise.resolve({
          userHelper: () => 'something',
        }),
      { virtual: true },
    );
    jest.mock('fs', () => ({
      statSync: jest.fn().mockImplementationOnce(() => {}),
    }));
    // eslint-disable-next-line global-require
    const externalHelpers = require('../externalHelpers').default;
    // @ts-ignore
    expect(await externalHelpers({ settings, query, helpers: [] })).toMatchSnapshot();
    // from cache
    // @ts-ignore
    expect(await externalHelpers({ settings, query, helpers: [] })).toMatchSnapshot();
  });
});
