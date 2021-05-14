/* eslint-disable global-require */
import path from 'path';

const removeSpacesFromStack = (stack) => stack.map((s) => ({ ...s, string: s.string.replace(/\s\s+/g, '') }));

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

    const hydrateStack = removeSpacesFromStack(componentProps.page.hydrateStack);

    expect(hydrateStack[0].string).toContain('<script>var datepickerPropsSwrzsrVDCd = {a:"b"};</script>');
    expect(hydrateStack[1].string).toContain(
      `<script nomodule defer src="${path.resolve(
        process.cwd(),
        `./test/components/Datepicker`,
      )}" onload="initdatepickerSwrzsrVDCd()"></script>`,
    );
    expect(hydrateStack[2].string).toContain(
      `<script nomodule>function initdatepickerSwrzsrVDCd(){new ___elderjs_Datepicker({target: document.getElementById('datepickerSwrzsrVDCd'),props:datepickerPropsSwrzsrVDCd,hydrate: true,});}</script>`,
    );
    expect(hydrateStack[3].string).toContain(
      `<script type="module">function initdatepickerSwrzsrVDCd(){import("${path.resolve(
        process.cwd(),
        `./test/components/Datepicker`,
      )}").then((component)=>{new component.default({target: document.getElementById('datepickerSwrzsrVDCd'),props: datepickerPropsSwrzsrVDCd,hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('datepickerSwrzsrVDCd'));if (document.eg_datepicker) {initdatepickerSwrzsrVDCd();} else {document.eg_datepicker = true;initdatepickerSwrzsrVDCd();}}}}, {rootMargin: '200px',threshold: 0});observerSwrzsrVDCd.observe(document.getElementById('datepickerSwrzsrVDCd'));});</script>`,
    );
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
        helpers: {
          permalinks: jest.fn(),
        },
        settings: {
          legacy: false,
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
        helpers: {
          permalinks: jest.fn(),
        },
        settings: {
          legacy: false,
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
