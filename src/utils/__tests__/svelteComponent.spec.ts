const componentProps = {
  page: {
    hydrateStack: [],
    errors: [],
    cssStack: [],
    headStack: [],

    helpers: {
      permalinks: jest.fn(),
    },
    settings: {
      legacy: true, // TODO: make tests for legacy: false
      distDir: 'test/public',
      rootDir: 'test',
      srcDir: 'test/src',
      $$internal: {
        hashedComponents: {
          Home: 'Home.a1b2c3',
          Datepicker: 'Datepicker.a1b2c3',
        },
        clientComponents: 'test/public/svelte',
        ssrComponents: 'test/___ELDER___/compiled',
      },
    },
  },
  props: {},
};

describe('#svelteComponent', () => {
  const { resolve } = require('path');
  beforeAll(() => {
    jest.mock('../getUniqueId', () => () => 'SwrzsrVDCd');
  });

  beforeEach(() => {
    jest.resetModules();
  });

  it('getComponentName works', () => {
    // eslint-disable-next-line global-require
    const { getComponentName } = require('../svelteComponent');
    expect(getComponentName('Home.svelte')).toEqual('Home');
    expect(getComponentName('Home.js')).toEqual('Home');
    expect(getComponentName('foo/bar/Home.js')).toEqual('Home');
    expect(getComponentName('foo/bar///Home.svelte')).toEqual('Home');
  });

  it('getClientSvelteFolder works', () => {
    // eslint-disable-next-line global-require
    const { getClientSvelteFolder } = require('../svelteComponent');
    expect(
      getClientSvelteFolder({
        settings: {
          distDir: '/test/public',
          $$internal: {
            clientComponents: '/test/public/svelte',
          },
        },
      }),
    ).toEqual('/svelte');
    expect(
      getClientSvelteFolder({
        settings: {
          distDir: '\\test\\public',
          $$internal: {
            clientComponents: '\\test\\public\\svelte',
          },
        },
      }),
    ).toEqual('/svelte');
  });

  it('svelteComponent works assuming components folder for SSR', () => {
    jest.mock(
      resolve(process.cwd(), './test/___ELDER___/compiled/components/Home.js'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<css>' },
          html: '<div class="svelte-home">mock html output</div>',
        }),
        _css: ['<css>'],
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home.svelte');
    expect(home(componentProps)).toEqual(`<div class="svelte-home">mock html output</div>`);
  });

  it('svelteComponent works with routes folder for SSR', () => {
    jest.mock(
      resolve(process.cwd(), './test/___ELDER___/compiled/routes/Home.js'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<css>' },
          html: '<div class="svelte-home">mock html output</div>',
        }),
        _css: ['<css>'],
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home.svelte', 'routes');
    expect(home(componentProps)).toEqual(`<div class="svelte-home">mock html output</div>`);
  });

  it('svelteComponent works with layouts folder for SSR', () => {
    jest.mock(
      resolve(process.cwd(), './test/___ELDER___/compiled/layouts/Home.js'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<css>' },
          html: '<div class="svelte-home">mock html output</div>',
        }),
        _css: ['<css>'],
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home.svelte', 'layouts');
    expect(home(componentProps)).toEqual(`<div class="svelte-home">mock html output</div>`);
  });

  it('svelteComponent works with partial hydration of subcomponent', () => {
    jest.mock(
      resolve(process.cwd(), './test/___ELDER___/compiled/components/Home.js'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<old>' },
          html:
            '<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Datepicker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "lazy" }"></div></div>',
        }),
        _css: ['<css>', '<css2>'],
      }),
      { virtual: true },
    );
    jest.mock(
      resolve(process.cwd(), './test/___ELDER___/compiled/components/Datepicker.js'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<old>' },
          html: '<div>DATEPICKER</div>',
        }),
        _css: ['<css>'],
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home.svelte');
    expect(home(componentProps)).toEqual(
      `<div class="svelte-datepicker"><div class="datepicker-component" id="datepickerSwrzsrVDCd"><div>DATEPICKER</div></div></div>`,
    );
    expect(componentProps.page.hydrateStack).toMatchSnapshot();
  });
});

/** TODO:
 * Recursive?
 
 */
