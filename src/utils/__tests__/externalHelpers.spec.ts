import { it, beforeEach, describe, expect, vi } from 'vitest';
import { sep } from 'path';
import normalizeSnapshot from '../normalizeSnapshot.js';
import getConfig from '../getConfig.js';
import externalHelpers from '../externalHelpers';

// process.cwd = () => 'test';

const query = {};

const helpers = {
  inlineSvelteComponent: () => `inlined`,
  permalinks: { key: () => '' },
  shortcode: () => '',
};

describe('#externalHelpers', () => {
  const settings = getConfig({ css: 'inline' });
  beforeEach(() => {
    vi.resetModules();
  });
  it('throws', async () => {
    vi.mock('fs', () => {
      class StatSyncError extends Error {
        code: 'ENOENT';

        constructor(msg: string) {
          super(msg);
          this.code = 'ENOENT';
        }
      }
      return {
        statSync: vi.fn(() => {
          throw new StatSyncError('no file');
        }),
      };
    });
    // eslint-disable-next-line global-require

    expect(await externalHelpers({ settings, query, helpers })).toBeUndefined();
    const modifiedSettings = {
      ...settings,
      srcDir: '',
    };
    expect(
      await externalHelpers({
        settings: modifiedSettings,
        query,
        helpers,
      }),
    ).toBeUndefined();
  });
  it('returns undefined if file is not there', async () => {
    vi.mock('fs', () => ({
      statSync: vi.fn().mockImplementationOnce(() => {
        throw new Error('');
      }),
    }));
    // eslint-disable-next-line global-require

    expect(await externalHelpers({ settings, query, helpers })).toBeUndefined();
  });
  it('works - userHelpers is not a function', async () => {
    vi.mock(
      `src${sep}helpers${sep}index.js`,

      () => ({
        userHelper: () => 'something',
      }),
    );
    vi.mock('fs', () => ({
      statSync: vi.fn().mockImplementationOnce(() => ''),
    }));

    const c1 = await externalHelpers({ settings, query, helpers });
    expect(normalizeSnapshot(c1)).toMatchSnapshot();
    // from cache

    const c2 = await externalHelpers({ settings, query, helpers });
    expect(normalizeSnapshot(c2)).toMatchSnapshot();
  });
  it('works - userHelpers is a function', async () => {
    vi.mock(
      `src${sep}helpers${sep}index.js`,
      () => () =>
        Promise.resolve({
          userHelper: () => 'something',
        }),
    );
    vi.mock('fs', () => ({
      statSync: vi.fn().mockImplementationOnce(() => ''),
    }));
    // eslint-disable-next-line global-require

    const c1 = await externalHelpers({ settings, query, helpers });
    expect(normalizeSnapshot(c1)).toMatchSnapshot();
    // from cache
    const c2 = await externalHelpers({ settings, query, helpers });
    expect(normalizeSnapshot(c2)).toMatchSnapshot();
  });
});
