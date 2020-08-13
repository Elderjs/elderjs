import { mocked } from 'ts-jest/utils';
import svelteComponent, { getComponentName, replaceSpecialCharacters } from '../svelteComponent';
import getUniqueId from '../getUniqueId';

jest.mock('../getUniqueId');

const mockedGetUniqueId = mocked(getUniqueId, true);
mockedGetUniqueId.mockImplementation(() => 'SwrzsrVDCd');

process.cwd = () => 'test';

jest.mock('path', () => ({
  resolve: (...strings) => strings.join('/').replace('./', ''),
}));

describe('#svelteComponent', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('getComponentName works', () => {
    expect(getComponentName('Home.svelte')).toEqual('Home');
    expect(getComponentName('Home.js')).toEqual('Home');
    expect(getComponentName('foo/bar/Home.js')).toEqual('Home');
    expect(getComponentName('foo/bar///Home.svelte')).toEqual('Home');
  });

  it('replaceSpecialCharacters works', () => {
    expect(replaceSpecialCharacters('&quot;&lt;&gt;&#39;&quot;\\n\\\\n\\"&amp;')).toEqual('"<>\'"\\n"&');
    expect(replaceSpecialCharacters('abcd 1234 <&""&>')).toEqual('abcd 1234 <&""&>');
  });

  const home = svelteComponent('Home.svelte');
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
        locations: {
          public: '/',
          svelte: {
            ssrComponents: '___ELDER___/compiled/',
            clientComponents: 'public/dist/svelte/',
          },
        },
        $$internal: {
          hashedComponents: {
            Home: 'Home.a1b2c3',
            Datepicker: 'Datepicker.a1b2c3',
          },
        },
      },
    },
    props: {},
  };

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
    expect(home(componentProps)).toEqual(
      `<span class="home-component" id="home-SwrzsrVDCd"><div class="svelte-home">mock html output</div></span>`,
    );
  });

  it('svelteComponent works with partial hydration of subcomponent', () => {
    jest.mock(
      'test/___ELDER___/compiled/Home.js',
      () => ({
        render: () => ({
          head: '<head>',
          css: { code: '<css>' },
          html:
            '<div class="svelte-datepicker"><div class="needs-hydration" data-component="Datepicker" data-data="{ "a": "b" }"></div></div>',
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
    expect(home(componentProps)).toEqual(
      `<span class="home-component" id="home-SwrzsrVDCd"><div class="svelte-datepicker"><span class="datepicker-component" id="datepicker-SwrzsrVDCd"><div>DATEPICKER</div></span></div></span>`,
    );
    expect(componentProps.page.hydrateStack).toEqual([
      {
        priority: 50,
        source: 'Datepicker',
        string: `
        function initdatepickerSwrzsrVDCd() {
          System.import('public/dist/svelte/Datepicker.a1b2c3.js').then(({ default: App }) => {
            new App({ target: document.getElementById('datepicker-SwrzsrVDCd'), hydrate: true, props: {"a":"b"} });
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
              observer.unobserve(document.getElementById('datepicker-SwrzsrVDCd'));
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
        observerSwrzsrVDCd.observe(document.getElementById('datepicker-SwrzsrVDCd'));
      });
    
      `,
      },
    ]);
  });
});
