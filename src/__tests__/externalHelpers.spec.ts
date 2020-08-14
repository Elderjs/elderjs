process.cwd = () => 'test';

jest.mock('path', () => ({
  join: (...strings) => strings.join('/').replace('./', '').replace('//', '/'),
}));

jest.mock('test/___ELDER___/helpers/index.js', () => ({ userHelper: jest.fn() }), { virtual: true });
jest.mock('test/src/helpers/index.js', () => () => Promise.resolve({ srcHelper: jest.fn() }), { virtual: true });

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

describe('#externalHelpers', () => {
  beforeEach(() => jest.resetModules());
  it('works - buildHelpers', async () => {
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
