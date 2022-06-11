// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-ts-comment */
import normalizeSnapshot from '../../utils/normalizeSnapshot.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import getConfig from '../../utils/getConfig';

const settings = getConfig({ css: 'inline' });
// process.cwd = () => 'test';

vi.mock('../../utils/svelteComponent', () => (component) => `<div class="svelteComponent">${component}</div>`);

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
    // @ts-ignore
    const routesObject = await routes(settings);

    expect(
      routesObject.content.permalink({ settings, request: { route: 'test', type: 'test', slug: 'content' } }),
    ).toEqual(`/content/`);
    expect(routesObject.content.permalink({ settings, request: { route: 'test', type: 'test', slug: '/' } })).toEqual(
      `/`,
    );
  });

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
    // @ts-ignore
    const routesObject = await routes(settings);

    // @ts-ignore
    constProcessedRoutesObject = normalizeSnapshot(routes(settings));

    expect(routesObject.content.all).toEqual([{ slug: 'content' }]);
    expect(routesObject.SomethingCamel.all).toEqual([{ slug: 'something-camel' }]);
    expect(routesObject.home.all).toEqual([{ slug: '/' }]);
  });

  it('works where things are set', async () => {
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
    // eslint-disable-next-line global-require
    const routes = (await import('../routes')).default;
    // @ts-ignore

    // @ts-ignore

    const r = normalizeSnapshot(routes(settings));
    expect(r.content.template).toContain('Another.svelte');
    expect(r.home.template).toContain('test/src/routes/home/home.svelte');
    expect(r.content.layout).toBe('Layout.svelte');
    expect(r.home.layout).toBe('Layout.svelte');
    expect(r.content.$$meta.type).toEqual('file');
    expect(r.content.name).toEqual('content');
  });

  it('no template', async () => {
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
      default: {
        permalink: () => 'content-permalink',
        all: () => null,
        layout: 'Layout.svelte',
      },
    }));

    vi.mock('test/src/routes/home/route.js', () => ({
      default: {
        permalink: () => 'home-permalink',
        all: () => null,
      },
    }));

    vi.mock('test/src/routes/content/data.js', () => ({ default: { foo: 'bar' } }));

    // eslint-disable-next-line global-require
    const routes = (await import('../routes')).default;

    // @ts-ignore

    const r = normalizeSnapshot(routes(settings));
    expect(r.content.template).toContain('test/src/routes/content/content.svelte');
    expect(r.home.template).toContain('test/src/routes/home/home.svelte');
    expect(r.content.layout).toBe('Layout.svelte');
    expect(r.home.layout).toBe('Layout.svelte');
  });

  it('tests case sensitivity', async () => {
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

    vi.mock('test/src/routes/home/route.js', () => ({
      default: {
        template: 'Home.svelte',
        permalink: () => 'home-permalink',
        all: () => null,
      },
    }));

    // eslint-disable-next-line global-require
    const routes = (await import('../routes')).default;

    // @ts-ignore

    const r = normalizeSnapshot(routes(settings));
    expect(r.home.template).toContain('Home.svelte');
    expect(r.home.layout).toBe('Layout.svelte');
  });
});
