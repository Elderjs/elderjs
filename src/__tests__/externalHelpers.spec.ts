process.cwd = () => 'test';

jest.mock('path', () => ({
  join: (...strings) => strings.join('/').replace('./', '').replace('//', '/'),
}));

const settings = {
  debug: {
    automagic: true,
  },
  locations: {
    buildFolder: './___ELDER___/',
    srcFolder: './src/',
  },
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
      locations: { ...settings.locations, buildFolder: '' },
    };
    expect(
      await externalHelpers({
        settings: modifiedSettings,
        query,
        helpers: [],
      }),
    ).toEqual(undefined);
  });
  it('works - buildHelpers', async () => {
    jest.mock(
      'test/___ELDER___/helpers/index.js',
      () => () =>
        Promise.resolve({
          userHelper: () => 'something',
        }),
      { virtual: true },
    );
    jest.mock('test/src/helpers/index.js', () => () => Promise.resolve({ srcHelper: jest.fn() }), { virtual: true });
    jest.mock('fs', () => ({
      statSync: jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('');
        })
        .mockImplementationOnce(() => {}),
    }));
    // eslint-disable-next-line global-require
    const externalHelpers = require('../externalHelpers').default;
    // @ts-ignore
    expect(await externalHelpers({ settings, query, helpers: [] })).toMatchSnapshot();
    // from cache
    // @ts-ignore
    expect(await externalHelpers({ settings, query, helpers: [] })).toMatchSnapshot();
  });
  it('works - userHelpers', async () => {
    jest.mock('test/___ELDER___/helpers/index.js', () => () => ({ userHelper: jest.fn() }), { virtual: true });
    jest.mock('test/src/helpers/index.js', () => () => Promise.resolve({ srcHelper: jest.fn() }), { virtual: true });
    jest.mock('fs', () => ({
      statSync: jest
        .fn()
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {}),
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
