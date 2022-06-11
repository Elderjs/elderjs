// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-ts-comment */
import normalizeSnapshot from '../../utils/normalizeSnapshot.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// process.cwd = () => 'test';

vi.mock('../../utils/svelteComponent', () => ({
  default: (component) => `<div class="svelteComponent">${component}</div>`,
}));

describe('#routes', () => {
  it('Sets a single request object for all array when when no all function', async () => {
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
          `test/src/routes/SomethingCamel/SomethingCamel.svelte`,
          `test/src/routes/SomethingCamel/route.js`,
          `test/src/routes/content/data.js`,
          `test/src/routes/content/Layout.svelte`,
        ])
        .mockImplementationOnce(() => [
          `test/___ELDER___/compiled/routes/home/Home.js`,
          `test/___ELDER___/compiled/components/AutoComplete.js`,
          `test/___ELDER___/compiled/routes/content/Default.js`,
          `test/___ELDER___/compiled/routes/content/Content.js`,
          `test/___ELDER___/compiled/SomethingCamel.js`,
        ]),
    }));
    vi.mock(`test/src/routes/content/route.js`, () => ({
      permalink: () => 'content-permalink',
      template: 'Default',
      layout: 'Layout.svelte',
    }));
    vi.mock('test/src/routes/content/data.js', () => ({ default: { foo: 'bar' } }));
    vi.mock('test/src/routes/home/route.js', () => ({
      permalink: () => 'home-permalink',
    }));
    vi.mock('test/src/routes/home/data.js', () => ({ default: { foo: 'bar' } }));

    vi.mock('test/src/routes/SomethingCamel/route.js', () => ({
      permalink: () => '/something-camel/',
    }));
    vi.mock('test/src/routes/SomethingCamel/data.js', () => ({ default: { foo: 'bar' } }));

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

    expect(r.content.all).toEqual([{ slug: 'content' }]);
    expect(r.SomethingCamel.all).toEqual([{ slug: 'something-camel' }]);
    expect(r.home.all).toEqual([{ slug: '/' }]);
  });
});
