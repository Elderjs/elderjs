/* eslint-disable global-require */
import path from 'path';

const removeSpacesFromStack = (stack) => stack.map((s) => ({ ...s, string: s.string.replace(/\s\s+/g, '') }));

const componentProps = {
  page: {
    hydrateStack: [],
    errors: [],
    cssStack: [],
    headStack: [],
    componentsToHydrate: [],

    helpers: {
      permalinks: jest.fn(),
    },
    settings: {
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
        findComponent: jest.fn((name, folder) => {
          const str = path.resolve(process.cwd(), `./test/${folder}/${name}`);
          return {
            ssr: str,
            iife: str,
            client: str,
          };
        }),
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

  it('svelteComponent works with layouts folder for SSR', () => {
    jest.mock(
      resolve(process.cwd(), './test/layouts/Layout.svelte'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<css>' },
          html: '<div class="svelte-home">mock html output</div>',
        }),
        _css: ['<css>'],
        _cssMap: ['<cssmap>'],
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Layout.svelte', 'layouts');
    expect(home(componentProps)).toEqual(`<div class="svelte-home">mock html output</div>`);
  });

  it('svelteComponent works with partial hydration of subcomponent', () => {
    jest.mock(
      resolve(process.cwd(), './test/components/Home'),
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
      resolve(process.cwd(), './test/components/Datepicker'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<old>' },
          html: '<div>DATEPICKER</div>',
        }),
        _css: ['<css>'],
        _cssMap: ['<cssmap>'],
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home', 'components');
    expect(home(componentProps)).toEqual(
      `<div class="svelte-datepicker"><div class="datepicker-component" id="datepickerSwrzsrVDCd"><div>DATEPICKER</div></div></div>`,
    );

    expect(componentProps.page.componentsToHydrate[0]).toMatchObject({
      hydrateOptions: { loading: 'lazy' },
      id: 'SwrzsrVDCd',
      name: 'datepickerSwrzsrVDCd',
      prepared: {},
      props: { a: 'b' },
    });
  });

  it('svelteComponent respects css settings: inline', () => {
    jest.mock(
      resolve(process.cwd(), './test/components/Home'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<old>' },
          html:
            '<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Datepicker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "lazy" }"></div></div>',
        }),
        _css: ['<css>', '<css2>'],
        _cssMap: ['<cssmap>', '<cssmap2>'],
      }),
      { virtual: true },
    );
    jest.mock(
      resolve(process.cwd(), './test/components/Datepicker'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<old>' },
          html: '<div>DATEPICKER</div>',
        }),
        _css: ['<css3>'],
        _cssMap: ['<cssmap3>'],
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home', 'components');
    const props = {
      page: {
        hydrateStack: [],
        errors: [],
        cssStack: [],
        headStack: [],
        svelteCss: [],
        componentsToHydrate: [],
        helpers: {
          permalinks: jest.fn(),
        },
        settings: {
          css: 'inline',
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
            findComponent: jest.fn((name, folder) => {
              const str = path.resolve(process.cwd(), `./test/${folder}/${name}`);
              return {
                ssr: str,
                iife: str,
                client: str,
              };
            }),
          },
        },
      },
      props: {},
    };
    expect(home(props)).toEqual(
      `<div class="svelte-datepicker"><div class="datepicker-component" id="datepickerSwrzsrVDCd"><div>DATEPICKER</div></div></div>`,
    );
    expect(props.page.svelteCss).toEqual([{ css: ['<css>', '<css2>'], cssMap: ['<cssmap>', '<cssmap2>'] }]);
    expect(props.page.componentsToHydrate[0]).toMatchObject({
      hydrateOptions: { loading: 'lazy' },
      id: 'SwrzsrVDCd',
      name: 'datepickerSwrzsrVDCd',
      prepared: {},
      props: { a: 'b' },
    });
  });

  it('svelteComponent respects css settings: file', () => {
    jest.mock(
      resolve(process.cwd(), './test/components/Home'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<old>' },
          html:
            '<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Datepicker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "lazy" }"></div></div>',
        }),
        _css: ['<css>', '<css2>'],
        _cssMap: ['<cssmap>', '<cssmap2>'],
      }),
      { virtual: true },
    );
    jest.mock(
      resolve(process.cwd(), './test/components/Datepicker'),
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<old>' },
          html: '<div>DATEPICKER</div>',
        }),
        _css: ['<css3>'],
        _cssMap: ['<cssmap3>'],
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home', 'components');
    const props = {
      page: {
        hydrateStack: [],
        errors: [],
        cssStack: [],
        headStack: [],
        svelteCss: [],
        componentsToHydrate: [],
        helpers: {
          permalinks: jest.fn(),
        },
        settings: {
          css: 'file',
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
            findComponent: jest.fn((name, folder) => {
              const str = path.resolve(process.cwd(), `./test/${folder}/${name}`);
              return {
                ssr: str,
                iife: str,
                client: str,
              };
            }),
          },
        },
      },
      props: {},
    };
    expect(home(props)).toEqual(
      `<div class="svelte-datepicker"><div class="datepicker-component" id="datepickerSwrzsrVDCd"><div>DATEPICKER</div></div></div>`,
    );
    expect(props.page.svelteCss).toEqual([]);
  });
});
