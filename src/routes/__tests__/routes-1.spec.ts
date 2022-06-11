// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import normalizeSnapshot from '../../utils/normalizeSnapshot';

// process.cwd = () => 'test';

vi.mock('../../utils/svelteComponent', () => ({
  default: (component) => `<div class="svelteComponent">${component}</div>`,
}));

describe('#routes', () => {
  it('Sets a default permalink function when undefined.', async () => {
    beforeEach(() => {
      vi.resetModules();
    });
    vi.mock('glob', () => ({
      sync: vi
        .fn()
        .mockImplementationOnce(() => [
          `test/src/routes/content/route.js`,
          `test/src/routes/content/Default.svelte`,
          `test/src/routes/home/Home.svelte`,
          `test/src/routes/home/route.js`,
          `test/src/routes/content/data.js`,
          `test/src/routes/content/Layout.svelte`,
        ])
        .mockImplementationOnce(() => [
          `test/___ELDER___/compiled/routes/home/Home.js`,
          `test/___ELDER___/compiled/components/AutoComplete.js`,
          `test/___ELDER___/compiled/routes/content/Default.js`,
          `test/___ELDER___/compiled/routes/content/Content.js`,
        ]),
    }));
    vi.mock(`test/src/routes/content/route.js`, () => ({
      all: [{ slug: 'content' }],
      template: 'Default',
      layout: 'Layout.svelte',
    }));
    vi.mock(`test/src/routes/content/data.js`, () => ({ default: { foo: 'bar' } }));
    vi.mock(`test/src/routes/home/route.js`, () => ({
      all: () => [{ slug: 'home' }],
    }));

    vi.mock(`test/src/routes/content/data.js`, () => ({ default: { foo: 'bar' } }));

    // eslint-disable-next-line global-require
    const routes = (await import('../routes')).default;
    const re = await routes({
      version: '',
      prefix: '',
      distDir: '',
      srcDir: '',
      rootDir: '',
      origin: '',
      lang: '',
      server: false,
      build: false,
      debug: {
        stacks: false,
        hooks: false,
        performance: false,
        build: false,
        automagic: false,
        shortcodes: false,
        props: false,
      },
      props: {
        compress: false,
        replacementChars: '',
        hydration: 'html',
      },
      hooks: {
        disable: [],
      },
      shortcodes: {
        openPattern: '',
        closePattern: '',
      },
      $$internal: {
        hashedComponents: undefined,
        ssrComponents: '',
        clientComponents: '',
        distElder: '',
        logPrefix: '',
        serverPrefix: '',
        findComponent: undefined,
        publicCssFile: '',
      },
      css: 'file',
    });

    const r = normalizeSnapshot(re);

    expect(r.content.permalink({ settings: {}, request: { route: 'test', type: 'test', slug: 'content' } })).toEqual(
      `/content/`,
    );
    expect(r.content.permalink({ settings: {}, request: { route: 'test', type: 'test', slug: '/' } })).toEqual(`/`);
  });
});
