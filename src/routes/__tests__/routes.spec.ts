process.cwd = () => 'test';

jest.mock('path', () => ({
  resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').slice(0, -1),
  join: (...strings) => strings.join('/').replace('./', '').replace('//', '/').slice(0, -1),
  posix: () => ({ dirname: () => '' }),
}));

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
          'test/src/routes/Content/route.js',
          'test/src/routes/Content/Default.svelte',
          'test/src/routes/Home/Home.svelte',
          'test/src/routes/Home/route.js',
          'test/src/routes/Content/data.js',
          'test/src/routes/Content/Layout.svelte',
        ])
        .mockImplementationOnce(() => [
          'test/___ELDER___/compiled/Home.js',
          'test/___ELDER___/compiled/AutoComplete.js',
          'test/___ELDER___/compiled/Default.js',
          'test/___ELDER___/compiled/Content.js',
        ]),
    }));
    jest.mock(
      'test/src/routes/Content/route.js',
      () => ({
        all: [{ slug: 'content' }],
        template: 'Default',
        layout: 'Layout.svelte',
      }),
      { virtual: true },
    );
    jest.mock('test/src/routes/Content/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });
    jest.mock(
      'test/src/routes/Home/route.js',
      () => ({
        all: () => [{ slug: 'home' }],
      }),
      { virtual: true },
    );

    jest.mock('test/src/routes/Content/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });

    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    const routesObject = routes(settings);

    expect(routesObject.Content.permalink({ request: { slug: 'content' } })).toEqual(`/content/`);
    expect(routesObject.Content.permalink({ request: { slug: '/' } })).toEqual(`/`);
    expect(routesObject).toMatchSnapshot();
  });

  it('Sets a single request object for all array when when no all function', () => {
    beforeEach(() => {
      jest.resetModules();
    });
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [
          'test/src/routes/Content/route.js',
          'test/src/routes/Content/Default.svelte',
          'test/src/routes/Home/Home.svelte',
          'test/src/routes/Home/route.js',
          'test/src/routes/SomethingCamel/SomethingCamel.svelte',
          'test/src/routes/SomethingCamel/route.js',
          'test/src/routes/Content/data.js',
          'test/src/routes/Content/Layout.svelte',
        ])
        .mockImplementationOnce(() => [
          'test/___ELDER___/compiled/Home.js',
          'test/___ELDER___/compiled/AutoComplete.js',
          'test/___ELDER___/compiled/Default.js',
          'test/___ELDER___/compiled/Content.js',
          'test/___ELDER___/compiled/SomethingCamel.js',
        ]),
    }));
    jest.mock(
      'test/src/routes/Content/route.js',
      () => ({
        permalink: () => 'content-permalink',
        template: 'Default',
        layout: 'Layout.svelte',
      }),
      { virtual: true },
    );
    jest.mock('test/src/routes/Content/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });
    jest.mock(
      'test/src/routes/Home/route.js',
      () => ({
        permalink: () => 'home-permalink',
      }),
      { virtual: true },
    );
    jest.mock('test/src/routes/Home/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });

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

    expect(routesObject.Content.all).toEqual([{ slug: 'content' }]);
    expect(routesObject.SomethingCamel.all).toEqual([{ slug: 'something-camel' }]);
    expect(routesObject.Home.all).toEqual([{ slug: '/' }]);
    expect(routesObject).toMatchSnapshot();
  });

  it('works', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [
          'test/src/routes/Content/route.js',
          'test/src/routes/Content/Default.svelte',
          'test/src/routes/Home/Home.svelte',
          'test/src/routes/Home/route.js',
          'test/src/routes/Content/data.js',
          'test/src/routes/Content/Layout.svelte',
        ])
        .mockImplementationOnce(() => [
          'test/___ELDER___/compiled/Home.js',
          'test/___ELDER___/compiled/AutoComplete.js',
          'test/___ELDER___/compiled/Default.js',
          'test/___ELDER___/compiled/Content.js',
        ]),
    }));

    jest.mock(
      'test/src/routes/Content/route.js',
      () => ({
        permalink: () => 'content-permalink',
        all: () => null,
        template: 'Default',
        layout: 'Layout.svelte',
      }),
      { virtual: true },
    );

    jest.mock(
      'test/src/routes/Home/route.js',
      () => ({
        permalink: () => 'home-permalink',
        all: () => null,
      }),
      { virtual: true },
    );

    jest.mock('test/src/routes/Content/data.js', () => ({ foo: 'bar' }), { virtual: true });
    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    expect(routes(settings)).toMatchSnapshot();
  });

  it('no template, ts imports', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [
          'test/src/routes/Content/route.js',
          'test/src/routes/Content/Default.svelte',
          'test/src/routes/Home/Home.svelte',
          'test/src/routes/Home/route.js',
          'test/src/routes/Content/data.js',
          'test/src/routes/Content/Layout.svelte',
        ])
        .mockImplementationOnce(() => [
          'test/___ELDER___/compiled/Home.js',
          'test/___ELDER___/compiled/AutoComplete.js',
          'test/___ELDER___/compiled/Default.js',
          'test/___ELDER___/compiled/Content.js',
        ]),
    }));
    jest.mock(
      'test/src/routes/Content/route.js',
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
      'test/src/routes/Home/route.js',
      () => ({
        default: {
          permalink: () => 'home-permalink',
          all: () => null,
        },
      }),
      { virtual: true },
    );

    jest.mock('test/src/routes/Content/data.js', () => ({ default: { foo: 'bar' } }), { virtual: true });

    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    expect(routes({ ...settings, typescript: true })).toMatchSnapshot();
  });
});
