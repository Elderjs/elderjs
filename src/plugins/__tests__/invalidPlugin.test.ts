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

vi.mock('../../utils/validations', () => ({
  validatePlugin: () => false,
  validateShortcode: (i) => i,
}));
vi.mock('fs-extra', () => ({
  default: {
    existsSync: () => true,
  },
}));

describe('#plugins', () => {
  it('plugin file found but is invalid', async () => {
    const initMock = vi.fn().mockImplementation((p) => Promise.resolve(p));
    vi.mock(path.resolve(`./test/src/plugins/elder-plugin-upload-s3/index.js`), () => ({
      hooks: [
        {
          hook: 'customizeHooks',
          name: 'test hook',
          description: 'just for testing',
          run: vi.fn(),
          $$meta: {
            type: 'hooks.js',
            addedBy: 'validations.spec.ts',
          },
        },
      ],
      routes: {},
      config: {},
      name: 'test',
      description: 'test',
      init: initMock,
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
    expect(initMock).toHaveBeenCalled();
  });
});
