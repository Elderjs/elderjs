import { sep } from 'path';
import normalizeSnapshot from '../../utils/normalizeSnapshot';

process.cwd = () => 'test';

jest.mock('../../utils/svelteComponent', () => (component) => `<div class="svelteComponent">${component}</div>`);

describe('#routes', () => {
  const settings = {
    debug: {
      automagic: true,
    },
    siteUrl: '',
    distDir: 'test/public',
    rootDir: 'test',
    srcDir: 'test/src',
    hooks: {},
    $$internal: {
      clientComponents: 'test/public/svelte',
      ssrComponents: 'test/___ELDER___/compiled',
    },
  };

  it('Sets a default permalink function when undefined.', () => {
    beforeEach(() => {
      jest.resetModules();
    });
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [
          `test${sep}src${sep}routes${sep}content${sep}route.js`,
          `test${sep}src${sep}routes${sep}content${sep}Default.svelte`,
          `test${sep}src${sep}routes${sep}home${sep}Home.svelte`,
          `test${sep}src${sep}routes${sep}home${sep}route.js`,
          `test${sep}src${sep}routes${sep}content${sep}data.js`,
          `test${sep}src${sep}routes${sep}content${sep}Layout.svelte`,
        ])
        .mockImplementationOnce(() => [
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}home${sep}Home.js`,
          `test${sep}___ELDER___${sep}compiled${sep}components${sep}AutoComplete.js`,
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}content${sep}Default.js`,
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}content${sep}Content.js`,
        ]),
    }));
    jest.mock(
      `test/src/routes/content/route.js`,
      () => ({
        all: [{ slug: 'content' }],
        template: 'Default',
        layout: 'Layout.svelte',
      }),
      { virtual: true },
    );
    jest.mock(`test/src/routes/content/data.js`, () => ({ default: { foo: 'bar' } }), { virtual: true });
    jest.mock(
      `test/src/routes/home/route.js`,
      () => ({
        all: () => [{ slug: 'home' }],
      }),
      { virtual: true },
    );

    jest.mock(`test/src/routes/content/data.js`, () => ({ default: { foo: 'bar' } }), { virtual: true });

    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    const routesObject = routes(settings);

    expect(routesObject.content.permalink({ request: { slug: 'content' } })).toEqual(`/content/`);
    expect(routesObject.content.permalink({ request: { slug: '/' } })).toEqual(`/`);
    expect(normalizeSnapshot(routesObject)).toMatchSnapshot();
  });

  it('Sets a single request object for all array when when no all function', () => {
    beforeEach(() => {
      jest.resetModules();
    });
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [
          `test${sep}src${sep}routes${sep}content${sep}route.js`,
          `test${sep}src${sep}routes${sep}content${sep}Default.svelte`,
          `test${sep}src${sep}routes${sep}home${sep}Home.svelte`,
          `test${sep}src${sep}routes${sep}home${sep}route.js`,
          `test${sep}src${sep}routes${sep}SomethingCamel${sep}SomethingCamel.svelte`,
          `test${sep}src${sep}routes${sep}SomethingCamel${sep}route.js`,
          `test${sep}src${sep}routes${sep}content${sep}data.js`,
          `test${sep}src${sep}routes${sep}content${sep}Layout.svelte`,
        ])
        .mockImplementationOnce(() => [
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}home${sep}Home.js`,
          `test${sep}___ELDER___${sep}compiled${sep}components${sep}AutoComplete.js`,
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}content${sep}Default.js`,
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}content${sep}Content.js`,
          `test${sep}___ELDER___${sep}compiled${sep}SomethingCamel.js`,
        ]),
    }));
    jest.mock(
      `test/src/routes/content/route.js`,
      () => ({
        permalink: () => 'content-permalink',
        template: 'Default',
        layout: 'Layout.svelte',
      }),
      { virtual: true },
    );
    jest.mock('test/src/routes/content/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });
    jest.mock(
      'test/src/routes/home/route.js',
      () => ({
        permalink: () => 'home-permalink',
      }),
      { virtual: true },
    );
    jest.mock('test/src/routes/home/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });

    jest.mock(
      'test/src/routes/SomethingCamel/route.js',
      () => ({
        permalink: () => '/something-camel/',
      }),
      { virtual: true },
    );
    jest.mock('test/src/routes/SomethingCamel/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });

    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    const routesObject = routes(settings);

    expect(routesObject.content.all).toEqual([{ slug: 'content' }]);
    expect(routesObject.SomethingCamel.all).toEqual([{ slug: 'something-camel' }]);
    expect(routesObject.home.all).toEqual([{ slug: '/' }]);
    expect(normalizeSnapshot(routesObject)).toMatchSnapshot();
  });

  it('works where things are set', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [
          `test${sep}src${sep}routes${sep}content${sep}route.js`,
          `test${sep}src${sep}routes${sep}content${sep}Default.svelte`,
          `test${sep}src${sep}routes${sep}home${sep}Home.svelte`,
          `test${sep}src${sep}routes${sep}home${sep}route.js`,
          `test${sep}src${sep}routes${sep}content${sep}data.js`,
          `test${sep}src${sep}routes${sep}content${sep}Layout.svelte`,
        ])
        .mockImplementationOnce(() => [
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}home${sep}Home.js`,
          `test${sep}___ELDER___${sep}compiled${sep}components${sep}AutoComplete.js`,
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}content${sep}Default.js`,
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}content${sep}Content.js`,
        ]),
    }));

    jest.mock(
      'test/src/routes/content/route.js',
      () => ({
        permalink: () => 'content-permalink',
        all: () => null,
        template: 'Default',
        layout: 'Layout.svelte',
      }),
      { virtual: true },
    );

    jest.mock(
      'test/src/routes/home/route.js',
      () => ({
        permalink: () => 'home-permalink',
        all: () => null,
      }),
      { virtual: true },
    );

    jest.mock('test/src/routes/content/data.js', () => ({ foo: 'bar' }), { virtual: true });
    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    expect(normalizeSnapshot(routes(settings))).toMatchSnapshot();
  });

  it('no template, ts imports', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [
          `test${sep}src${sep}routes${sep}content${sep}route.js`,
          `test${sep}src${sep}routes${sep}content${sep}Default.svelte`,
          `test${sep}src${sep}routes${sep}home${sep}Home.svelte`,
          `test${sep}src${sep}routes${sep}home${sep}route.js`,
          `test${sep}src${sep}routes${sep}content${sep}data.js`,
          `test${sep}src${sep}routes${sep}content${sep}Layout.svelte`,
        ])
        .mockImplementationOnce(() => [
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}Home${sep}Home.js`,
          `test${sep}___ELDER___${sep}compiled${sep}components${sep}AutoComplete.js`,
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}content${sep}Default.js`,
          `test${sep}___ELDER___${sep}compiled${sep}routes${sep}Content${sep}Content.js`,
        ]),
    }));
    jest.mock(
      'test/src/routes/content/route.js',
      () => ({
        default: {
          permalink: () => 'content-permalink',
          all: () => null,
          layout: 'Layout.svelte',
        },
      }),
      { virtual: true },
    );

    jest.mock(
      'test/src/routes/home/route.js',
      () => ({
        default: {
          permalink: () => 'home-permalink',
          all: () => null,
        },
      }),
      { virtual: true },
    );

    jest.mock('test/src/routes/content/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });

    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    expect(normalizeSnapshot(routes({ ...settings, typescript: true }))).toMatchSnapshot();
  });
});
