// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-ts-comment */
import normalizeSnapshot from '../../utils/normalizeSnapshot.js';
import { describe, it, expect, vi } from 'vitest';
import EventEmitter from 'events';

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
      `test/___ELDER___/compiled/routes/home/Home.js`,
      `test/___ELDER___/compiled/components/AutoComplete.js`,
      `test/___ELDER___/compiled/routes/content/Default.js`,
      `test/___ELDER___/compiled/routes/content/Content.js`,
    ]),
}));

vi.mock('test/src/routes/content/route.js', () => ({
  permalink: () => 'content-permalink',
  all: () => null,
  template: 'Another.svelte',
  layout: 'Layout.svelte',
}));

vi.mock('test/src/routes/home/route.js', () => ({
  permalink: () => 'home-permalink',
  all: () => null,
}));

vi.mock('test/src/routes/content/data.js', () => ({ foo: 'bar' }));
describe('#routes', () => {
  it('works where things are set', async () => {
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
      debug: {
        stacks: false,
        hooks: false,
        performance: false,
        build: false,
        shortcodes: false,
        props: false,
        reload: false,
      },
      replacements: {},
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
        reloadHash: 'test',
        ssrComponents: '',
        clientComponents: '',
        distElder: '',
        logPrefix: '',
        serverPrefix: '',
        findComponent: undefined,
        production: false,
        status: 'bootstrapped',
        watcher: new EventEmitter(),
        files: {
          all: [
            `test/src/routes/content/route.js`,
            `test/src/routes/content/Default.svelte`,
            `test/src/routes/home/Home.svelte`,
            `test/src/routes/home/route.js`,
            `test/src/routes/content/data.js`,
            `test/src/routes/content/Layout.svelte`,
          ],
          client: [],
          hooks: '',
          publicCssFile: '',
          routes: ['test/src/routes/content/route.js', 'test/src/routes/home/route.js'],
          server: [
            `test/___ELDER___/compiled/routes/home/Home.js`,
            `test/___ELDER___/compiled/components/AutoComplete.js`,
            `test/___ELDER___/compiled/routes/content/Default.js`,
            `test/___ELDER___/compiled/routes/content/Content.js`,
          ],
          shortcodes: '',
        },
      },
      css: 'file',
    });
    const r = normalizeSnapshot(re);

    console.log(r);
    expect(r.content.template).toContain('Another.svelte');
    expect(r.home.template).toContain('/routes/home/home.svelte');
    expect(r.content.layout).toBe('Layout.svelte');
    expect(r.home.layout).toBe('Layout.svelte');
    expect(r.content.$$meta.type).toEqual('file');
    expect(r.content.name).toEqual('content');
  });
});
