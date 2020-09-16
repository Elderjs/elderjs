process.cwd = () => 'test';

jest.mock('path', () => ({
  resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').slice(0, -1),
  join: (...strings) => strings.join('/').replace('./', '').replace('//', '/').slice(0, -1),
  posix: () => ({ dirname: () => '' }),
}));

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

  it('throws error when no permalink function', () => {
    beforeEach(() => {
      jest.resetModules();
    });
    jest.mock(
      'test/src/routes/Content/route.js',
      () => ({
        all: () => null,
        template: 'Default',
        layout: 'Layout.svelte',
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    expect(() => routes(settings)).toThrow(
      'test/src/routes/Content/route.js does not include a permalink attribute that is a string or function.',
    );
  });

  it('throws error when no all function', () => {
    beforeEach(() => {
      jest.resetModules();
    });
    jest.mock(
      'test/src/routes/Content/route.js',
      () => ({
        permalink: () => 'content-permalink',
        template: 'Default',
        layout: 'Layout.svelte',
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const routes = require('../routes').default;
    // @ts-ignore
    expect(() => routes(settings)).toThrow(
      'test/src/routes/Content/route.js does not include a all attribute that is is a function or an array.',
    );
  });

  it('works', () => {
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
