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
  it('plugin has routes, hooks and shortcodes', async () => {
    vi.mock(path.resolve(`./src/utils/validations`), () => ({
      validatePlugin: (i) => i,
      validateHook: () => ({ priority: 50 }),
      validateShortcode: (i) => i,
    }));
    vi.mock('fs-extra', () => ({
      default: {
        existsSync: () => true,
      },
    }));
    const initMock = vi.fn().mockImplementation((p) => Promise.resolve(p));
    vi.mock(path.resolve(`./test/src/plugins/elder-plugin-upload-s3/index.js`), () => ({
      hooks: [
        {
          hook: 'customizeHooks',
          name: 'test hook',
          description: 'just for testing',
          priority: 50,
          run: vi.fn(),
        },
      ],
      routes: {
        routeA: {
          data: vi.fn(),
          template: 'template/routeA.svelte',
          layout: 'layout/routeA.svelte',
          permalink: () => '/',
        },
        routeB: {
          data: { foo: 'bar' },
          // no template defined
        },
      },
      shortcodes: [
        {
          shortcode: 'svelteComponent',
          run: () => '',
        },
      ],
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

    expect(pluginRoutes).toEqual({
      routeA: {
        $$meta: {
          addedBy: 'elder-plugin-upload-s3',
          type: 'plugin',
        },
        data: expect.any(Function),
        layout: 'layout/routeA.svelte',
        layoutComponent: expect.any(Function),
        template: 'template/routeA.svelte',
        templateComponent: expect.any(Function),
        permalink: expect.any(Function),
      },
    });
    expect(pluginHooks).toEqual([
      {
        priority: 50,
        $$meta: {
          addedBy: 'elder-plugin-upload-s3',
          type: 'plugin',
        },
      },
    ]);
    expect(pluginShortcodes).toHaveLength(1);
    expect(initMock).toHaveBeenCalled();
  });
});
