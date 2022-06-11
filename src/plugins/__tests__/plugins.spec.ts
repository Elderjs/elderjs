import { pluginVersionCheck } from '../index.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const findComponent = () => ({ ssr: true, client: true, iife: undefined });

const perf = {
  start: () => undefined,
  end: () => undefined,
  timings: [],
  stop: () => undefined,
  prefix: () => ({ start: () => undefined, end: () => undefined }),
};
beforeEach(() => {
  vi.resetModules();
});
describe('#plugins', () => {
  describe('#pluginVersionCheck', () => {
    it('Returns false: Elder v1.4.13 < Required v1.4.14', () => {
      expect(pluginVersionCheck('1.4.13', '1.4.14')).toBe(false);
    });

    it('Returns false: Elder v1.4.13 < Required v5.4.14', () => {
      expect(pluginVersionCheck('1.4.13', '5.4.14')).toBe(false);
    });

    it('Returns true: Elder v1.4.14 > Required v1.4.13', () => {
      expect(pluginVersionCheck('1.4.14', '1.4.13')).toBe(true);
    });
    it('Returns true: Elder v1.4.14 = Required v1.4.14', () => {
      expect(pluginVersionCheck('1.4.14', '1.4.14')).toBe(true);
    });
    it('Returns true: Elder v2.0.0 > Required v1.4.14', () => {
      expect(pluginVersionCheck('2.0.0', '1.4.14')).toBe(true);
    });
  });

  it('no plugins in settings', async () => {
    const plugins = await import('../index.js');

    const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins.default({
      perf,
      settings: {
        plugins: {},
        srcDir: 'test/src',
        rootDir: 'test',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        /// @ts-ignore
        $$internal: { ssrComponents: 'test/___ELDER___/compiled', findComponent },
      },
    });
    expect(pluginRoutes).toEqual({});
    expect(pluginHooks).toEqual([]);
    expect(pluginShortcodes).toEqual([]);
  });

  it('plugin not found in plugins or node_modules folder, skipping', async () => {
    vi.mock('fs-extra', () => ({
      default: {
        existsSync: () => false,
      },
    }));

    const plugins = await import('../index.js');

    const { pluginRoutes, pluginHooks, pluginShortcodes } = await plugins.default({
      perf,
      settings: {
        plugins: {
          'elder-plugin-upload-s3': {
            dataBucket: 'elderguide.com',
            htmlBucket: 'elderguide.com',
            deployId: '11111111',
          },
        },
        srcDir: 'test/src',
        rootDir: 'test',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        $$internal: { ssrComponents: 'test/___ELDER___/compiled', findComponent },
      },
    });
    expect(pluginRoutes).toEqual({});
    expect(pluginHooks).toEqual([]);
    expect(pluginShortcodes).toEqual([]);
  });
});
