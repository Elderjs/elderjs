import path from 'path';
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
  it('plugin file found in node modules, but is empty, skipping', async () => {
    vi.mock('fs-extra', () => ({
      default: {
        existsSync: () => true,
        readJsonSync: () => ({ main: './index.js' }),
      },
    }));
    vi.mock(path.resolve(`./test/src/plugins/elder-plugin-upload-s3/index.js`), () => '');
    vi.mock(path.resolve(`./test/node_modules/elder-plugin-upload-s3/package.json`), () => ({ main: './index.js' }));
    vi.mock(path.resolve(`./test/node_modules/elder-plugin-upload-s3/index.js`), () => '');

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
