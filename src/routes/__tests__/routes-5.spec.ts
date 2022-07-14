// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-ts-comment */
import normalizeSnapshot from '../../utils/normalizeSnapshot.js';
import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';

// process.cwd = () => 'test';

vi.mock('../../utils/svelteComponent', () => ({
  default: (component) => `<div class="svelteComponent">${component}</div>`,
}));

vi.mock('glob', () => ({
  sync: vi
    .fn()
    .mockImplementationOnce(() => [
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

vi.mock('test/src/routes/home/route.js', () => ({
  template: 'Home.svelte',
  permalink: () => 'home-permalink',
  all: () => null,
}));

describe('#routes', () => {
  it('tests case sensitivity', async () => {
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
            `test/src/routes/content/Default.svelte`,
            `test/src/routes/home/Home.svelte`,
            `test/src/routes/home/route.js`,
            `test/src/routes/content/data.js`,
            `test/src/routes/content/Layout.svelte`,
          ],
          client: [],
          hooks: '',
          publicCssFile: '',
          routes: ['test/src/routes/home/route.js'],
          server: [
            `test/___ELDER___/compiled/routes/Home/Home.js`,
            `test/___ELDER___/compiled/components/AutoComplete.js`,
            `test/___ELDER___/compiled/routes/content/Default.js`,
            `test/___ELDER___/compiled/routes/Content/Content.js`,
          ],
          shortcodes: '',
        },
      },
      css: 'file',
    });

    const r = normalizeSnapshot(re);
    expect(r.home.template).toContain('Home.svelte');
    expect(r.home.layout).toBe('Layout.svelte');
  });
});
