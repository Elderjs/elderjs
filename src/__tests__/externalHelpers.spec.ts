import { sep } from 'path';
import normalizeSnapshot from '../utils/normalizeSnapshot';

process.cwd = () => 'test';

const settings = {
  debug: {
    automagic: true,
  },
  srcDir: `.${sep}src${sep}`,
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
    expect(await externalHelpers({ settings, query, helpers: [] })).toBeUndefined();
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
    ).toBeUndefined();
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
    expect(await externalHelpers({ settings, query, helpers: [] })).toBeUndefined();
  });
  it('works - userHelpers is not a function', async () => {
    jest.mock(
      `src${sep}helpers${sep}index.js`,

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
    const c1 = await externalHelpers({ settings, query, helpers: [] });
    expect(normalizeSnapshot(c1)).toMatchSnapshot();
    // from cache
    // @ts-ignore
    const c2 = await externalHelpers({ settings, query, helpers: [] });
    expect(normalizeSnapshot(c2)).toMatchSnapshot();
  });
  it('works - userHelpers is a function', async () => {
    jest.mock(
      `src${sep}helpers${sep}index.js`,
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
    const c1 = await externalHelpers({ settings, query, helpers: [] });
    expect(normalizeSnapshot(c1)).toMatchSnapshot();
    // from cache
    // @ts-ignore
    const c2 = await externalHelpers({ settings, query, helpers: [] });
    expect(normalizeSnapshot(c2)).toMatchSnapshot();
  });
});
