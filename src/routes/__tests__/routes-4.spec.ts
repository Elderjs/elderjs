// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-ts-comment */
import normalizeSnapshot from '../../utils/normalizeSnapshot.js';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../utils/svelteComponent', () => ({
  default: (component) => `<div class="svelteComponent">${component}</div>`,
}));

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
      `test/___ELDER___/compiled/routes/Home/Home.js`,
      `test/___ELDER___/compiled/components/AutoComplete.js`,
      `test/___ELDER___/compiled/routes/content/Default.js`,
      `test/___ELDER___/compiled/routes/Content/Content.js`,
    ]),
}));
vi.mock('test/src/routes/content/route.js', () => ({
  permalink: () => 'content-permalink',
  all: () => null,
  layout: 'Layout.svelte',
}));

vi.mock('test/src/routes/home/route.js', () => ({
  template: 'Home.svelte',
  permalink: () => 'home-permalink',
  all: () => null,
}));

vi.mock('test/src/routes/content/data.js', () => ({ default: { foo: 'bar' } }));

describe('#routes', () => {
  it('no template', async () => {
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
    console.log(re);
    const r = normalizeSnapshot(re);
    expect(r.content.template).toContain('routes/content/content.svelte');
    expect(r.home.template).toContain('Home.svelte');
    expect(r.content.layout).toBe('Layout.svelte');
    expect(r.home.layout).toBe('Layout.svelte');
  });
});
