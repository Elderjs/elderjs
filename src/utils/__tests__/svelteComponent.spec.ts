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
  beforeAll(() => {
    jest.mock('../getUniqueId', () => () => 'SwrzsrVDCd');
    process.cwd = () => 'test';

    jest.mock('path', () => ({
      resolve: (...strings) => strings.join('/').replace('./', ''),
    }));
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

  it('replaceSpecialCharacters works', () => {
    // eslint-disable-next-line global-require
    const { replaceSpecialCharacters } = require('../svelteComponent');
    expect(replaceSpecialCharacters('&quot;&lt;&gt;&#39;&quot;\\n\\\\n\\"&amp;')).toEqual('"<>\'"\\n"&');
    expect(replaceSpecialCharacters('abcd 1234 <&""&>')).toEqual('abcd 1234 <&""&>');
  });

  it('svelteComponent works', () => {
    jest.mock(
      'test/___ELDER___/compiled/Home.js',
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<css>' },
          html: '<div class="svelte-home">mock html output</div>',
        }),
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home.svelte');
    expect(home(componentProps)).toEqual(`<div class="svelte-home">mock html output</div>`);
  });

  it('svelteComponent works with partial hydration of subcomponent', () => {
    jest.mock(
      'test/___ELDER___/compiled/Home.js',
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<css>' },
          html:
            '<div class="svelte-datepicker"><div class="ejs-component" data-ejs-component="Datepicker" data-ejs-props="{ "a": "b" }" data-ejs-options="{ "loading": "lazy" }"></div></div>',
        }),
      }),
      { virtual: true },
    );
    jest.mock(
      'test/___ELDER___/compiled/Datepicker.js',
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<css>' },
          html: '<div>DATEPICKER</div>',
        }),
      }),
      { virtual: true },
    );
    // eslint-disable-next-line global-require
    const svelteComponent = require('../svelteComponent').default;
    const home = svelteComponent('Home.svelte');
    expect(home(componentProps)).toEqual(
      `<div class="svelte-datepicker"><div class="datepicker" id="datepickerSwrzsrVDCd"><div>DATEPICKER</div></div></div>`,
    );
    expect(componentProps.page.hydrateStack).toEqual([
      {
        priority: 50,
        source: 'Datepicker',
        string: `
        function initdatepickerSwrzsrVDCd() {
          
      System.import('/svelte/Datepicker.a1b2c3.js').then((datepickerSwrzsrVDCd) => {
        new datepickerSwrzsrVDCd.default({ target: document.getElementById('datepickerSwrzsrVDCd'), hydrate: true, props: {a:"b"} });
      });
        }
        
      window.addEventListener('load', function (event) {
        var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(document.getElementById('datepickerSwrzsrVDCd'));
              if (document.eg_datepicker) {
                initdatepickerSwrzsrVDCd();
              } else {
                document.eg_datepicker = true;
                initdatepickerSwrzsrVDCd();
              }
            }
          }
        }, {
          rootMargin: '200px',
          threshold: 0
        });
        observerSwrzsrVDCd.observe(document.getElementById('datepickerSwrzsrVDCd'));
      });
    
      `,
      },
    ]);
  });
});

/** TODO:
 * hydrate-options={{ loading: 'lazy' }} This is the default config, uses intersection observer.
 * hydrate-options={{ loading: 'eager' }} This would cause the component to be hydrate in a blocking manner as soon as the js is rendered.
 * hydrate-options={{ loading: 'none' }} This allows arbitray svelte components to be rendered server side but not hydrated.
 * hydrate-options={{ preload: true }} This adds a preload to the head stack as outlined above... could be preloaded without forcing blocking.
 * hydrate-options={{ preload: true, loading: 'eager' }} This would preload and be blocking.
 * hydrate-options={{ rootMargin: '500px', threshold: 0 }} This would adjust the root margin of the intersection observer. Only usable with loading: 'lazy'
 */
