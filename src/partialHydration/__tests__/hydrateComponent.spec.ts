import { IntersectionObserver } from '../hydrateComponent';

jest.mock('../../utils/getUniqueId', () => () => 'SwrzsrVDCd');

const common = {
  innerHtml: 'componentHtml',
  componentName: 'test',
  iife: 'iife',
  clientSrcMjs: 'mjs',
  props: { a: 'b' },
};

const removeSpacesFromStack = (stack) => stack.map((s) => ({ ...s, string: s.string.replace(/\s\s+/g, '') }));

describe('#hydrateComponent', () => {
  test('#IntersectionObserver', () => {
    expect(
      IntersectionObserver({
        el: 'targetElement',
        name: 'IntersectionObserver.spec.js',
        loaded: 'console.log("loaded");',
        notLoaded: 'console.log("not loaded");',
        id: 'SwrzsrVDCd',
      }).trim(),
    ).toEqual(`window.addEventListener('load', function (event) {
        var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {
          var objK = Object.keys(entries);
          var objKl = objK.length;
          var objKi = 0;
          for (; objKi < objKl; objKi++) {
            var entry = entries[objK[objKi]];
            if (entry.isIntersecting) {
              observer.unobserve(targetElement);
              if (document.eg_IntersectionObserver.spec.js) {
                console.log("loaded");
              } else {
                document.eg_IntersectionObserver.spec.js = true;
                console.log("not loaded");
              }
            }
          }
        }, {
          rootMargin: '200px',
          threshold: 0
        });
        observerSwrzsrVDCd.observe(targetElement);
      });`);
  });

  it(`tests hydrate-options={{ loading: 'lazy' }} This is the default config, uses intersection observer.`, () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];
    const result = hydrateComponent({
      ...common,
      hydrateOptions: { loading: 'lazy' },
      page: { hydrateStack, headStack },
    });
    expect(result).toEqual(`<div class="test-component" id="testSwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toEqual([]);
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      expect.arrayContaining(
        removeSpacesFromStack([
          { priority: 100, source: 'testSwrzsrVDCd', string: '<script>var testPropsSwrzsrVDCd = {a:"b"};</script>' },
          {
            priority: 99,
            source: 'testSwrzsrVDCd',
            string: '<script nomodule defer src="iife" onload="inittestSwrzsrVDCd()"></script>',
          },
          {
            priority: 98,
            source: 'testSwrzsrVDCd',
            string:
              "<script nomodule>function inittestSwrzsrVDCd(){new ___elderjs_test({target: document.getElementById('testSwrzsrVDCd'),props:testPropsSwrzsrVDCd,hydrate: true,});}</script>",
          },
          {
            priority: 30,
            source: 'testSwrzsrVDCd',
            string:
              "<script type=\"module\">function inittestSwrzsrVDCd(){import(\"mjs\").then((component)=>{new component.default({target: document.getElementById('testSwrzsrVDCd'),props: testPropsSwrzsrVDCd,hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('testSwrzsrVDCd'));if (document.eg_test) {inittestSwrzsrVDCd();} else {document.eg_test = true;inittestSwrzsrVDCd();}}}}, {rootMargin: '200px',threshold: 0});observerSwrzsrVDCd.observe(document.getElementById('testSwrzsrVDCd'));});</script>",
          },
        ]),
      ),
    );
  });
  it(`tests hydrate-options={{ loading: 'eager' }} This would cause the component to be hydrate in a blocking manner as soon as the js is rendered.`, () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];
    const result = hydrateComponent({
      ...common,
      hydrateOptions: { loading: 'eager' },
      page: { hydrateStack, headStack },
    });
    expect(result).toEqual(`<div class="test-component" id="testSwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toEqual([]);
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      expect.arrayContaining(
        removeSpacesFromStack([
          { priority: 100, source: 'testSwrzsrVDCd', string: '<script>var testPropsSwrzsrVDCd = {a:"b"};</script>' },
          {
            priority: 99,
            source: 'testSwrzsrVDCd',
            string: '<script nomodule defer src="iife" onload="inittestSwrzsrVDCd()"></script>',
          },
          {
            priority: 98,
            source: 'testSwrzsrVDCd',
            string:
              "<script nomodule>function inittestSwrzsrVDCd(){new ___elderjs_test({target: document.getElementById('testSwrzsrVDCd'),props:testPropsSwrzsrVDCd,hydrate: true,});}</script>",
          },
          {
            priority: 30,
            source: 'testSwrzsrVDCd',
            string:
              '<script type="module">function inittestSwrzsrVDCd(){import("mjs").then((component)=>{new component.default({target: document.getElementById(\'testSwrzsrVDCd\'),props: testPropsSwrzsrVDCd,hydrate: true});});}inittestSwrzsrVDCd();</script>',
          },
        ]),
      ),
    );
  });

  it(`tests hydrate-options={{ loading: 'none' }} This allows arbitrary svelte components to be rendered server side but not hydrated.`, () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];
    const result = hydrateComponent({
      ...common,
      hydrateOptions: { loading: 'none' },
      page: { hydrateStack, headStack },
    });
    expect(result).toEqual(`componentHtml`);
    expect(headStack).toEqual([]);
    expect(hydrateStack).toStrictEqual([]);
  });

  it(`tests hydrate-options={{ preload: true }} This adds a preload to the head stack as outlined above... could be preloaded without forcing blocking.`, () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];
    const result = hydrateComponent({
      ...common,
      hydrateOptions: { preload: true },
      page: { hydrateStack, headStack },
    });
    expect(result).toEqual(`<div class="test-component" id="testSwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toStrictEqual(
      expect.arrayContaining([
        {
          priority: 50,
          source: 'test',
          string: '<link rel="preload" href="mjs" as="script">',
        },
      ]),
    );
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      expect.arrayContaining(
        removeSpacesFromStack([
          { priority: 100, source: 'testSwrzsrVDCd', string: '<script>var testPropsSwrzsrVDCd = {a:"b"};</script>' },
          {
            priority: 99,
            source: 'testSwrzsrVDCd',
            string: '<script nomodule defer src="iife" onload="inittestSwrzsrVDCd()"></script>',
          },
          {
            priority: 98,
            source: 'testSwrzsrVDCd',
            string:
              "<script nomodule>function inittestSwrzsrVDCd(){new ___elderjs_test({target: document.getElementById('testSwrzsrVDCd'),props:testPropsSwrzsrVDCd,hydrate: true,});}</script>",
          },
          {
            priority: 30,
            source: 'testSwrzsrVDCd',
            string:
              "<script type=\"module\">function inittestSwrzsrVDCd(){import(\"mjs\").then((component)=>{new component.default({target: document.getElementById('testSwrzsrVDCd'),props: testPropsSwrzsrVDCd,hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('testSwrzsrVDCd'));if (document.eg_test) {inittestSwrzsrVDCd();} else {document.eg_test = true;inittestSwrzsrVDCd();}}}}, {rootMargin: '200px',threshold: 0});observerSwrzsrVDCd.observe(document.getElementById('testSwrzsrVDCd'));});</script>",
          },
        ]),
      ),
    );
  });
  it(`tests hydrate-options={{ preload: true, loading: 'eager' }} This would preload and be blocking.`, () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];
    const result = hydrateComponent({
      ...common,
      hydrateOptions: { preload: true, loading: 'eager' },
      page: { hydrateStack, headStack },
    });
    expect(result).toEqual(`<div class="test-component" id="testSwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toStrictEqual(
      expect.arrayContaining([
        {
          priority: 50,
          source: 'test',
          string: '<link rel="preload" href="mjs" as="script">',
        },
      ]),
    );
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      expect.arrayContaining(
        removeSpacesFromStack([
          { priority: 100, source: 'testSwrzsrVDCd', string: '<script>var testPropsSwrzsrVDCd = {a:"b"};</script>' },
          {
            priority: 99,
            source: 'testSwrzsrVDCd',
            string: '<script nomodule defer src="iife" onload="inittestSwrzsrVDCd()"></script>',
          },
          {
            priority: 98,
            source: 'testSwrzsrVDCd',
            string:
              "<script nomodule>function inittestSwrzsrVDCd(){new ___elderjs_test({target: document.getElementById('testSwrzsrVDCd'),props:testPropsSwrzsrVDCd,hydrate: true,});}</script>",
          },
          {
            priority: 30,
            source: 'testSwrzsrVDCd',
            string:
              '<script type="module">function inittestSwrzsrVDCd(){import("mjs").then((component)=>{new component.default({target: document.getElementById(\'testSwrzsrVDCd\'),props: testPropsSwrzsrVDCd,hydrate: true});});}inittestSwrzsrVDCd();</script>',
          },
        ]),
      ),
    );
  });
  it(`tests hydrate-options={{ rootMargin: '300px', threshold: 20 }} This would adjust the root margin of the intersection observer. Only usable with loading: 'lazy'`, () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];
    const result = hydrateComponent({
      ...common,
      hydrateOptions: { rootMargin: '300px', threshold: 20 },
      page: { hydrateStack, headStack },
    });
    expect(result).toEqual(`<div class="test-component" id="testSwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toStrictEqual(expect.arrayContaining([]));
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      expect.arrayContaining(
        removeSpacesFromStack([
          { priority: 100, source: 'testSwrzsrVDCd', string: '<script>var testPropsSwrzsrVDCd = {a:"b"};</script>' },
          {
            priority: 99,
            source: 'testSwrzsrVDCd',
            string: '<script nomodule defer src="iife" onload="inittestSwrzsrVDCd()"></script>',
          },
          {
            priority: 98,
            source: 'testSwrzsrVDCd',
            string:
              "<script nomodule>function inittestSwrzsrVDCd(){new ___elderjs_test({target: document.getElementById('testSwrzsrVDCd'),props:testPropsSwrzsrVDCd,hydrate: true,});}</script>",
          },
          {
            priority: 30,
            source: 'testSwrzsrVDCd',
            string:
              "<script type=\"module\">function inittestSwrzsrVDCd(){import(\"mjs\").then((component)=>{new component.default({target: document.getElementById('testSwrzsrVDCd'),props: testPropsSwrzsrVDCd,hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('testSwrzsrVDCd'));if (document.eg_test) {inittestSwrzsrVDCd();} else {document.eg_test = true;inittestSwrzsrVDCd();}}}}, {rootMargin: '300px',threshold: 20});observerSwrzsrVDCd.observe(document.getElementById('testSwrzsrVDCd'));});</script>",
          },
        ]),
      ),
    );
  });

  it('tests with no iife', () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];
    const result = hydrateComponent({
      ...common,
      iife: undefined,
      hydrateOptions: { loading: 'lazy' },
      page: { hydrateStack, headStack },
    });
    expect(result).toEqual(`<div class="test-component" id="testSwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toEqual([]);
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      expect.arrayContaining(
        removeSpacesFromStack([
          { priority: 100, source: 'testSwrzsrVDCd', string: '<script>var testPropsSwrzsrVDCd = {a:"b"};</script>' },
          {
            priority: 30,
            source: 'testSwrzsrVDCd',
            string:
              "<script type=\"module\">function inittestSwrzsrVDCd(){import(\"mjs\").then((component)=>{new component.default({target: document.getElementById('testSwrzsrVDCd'),props: testPropsSwrzsrVDCd,hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('testSwrzsrVDCd'));if (document.eg_test) {inittestSwrzsrVDCd();} else {document.eg_test = true;inittestSwrzsrVDCd();}}}}, {rootMargin: '200px',threshold: 0});observerSwrzsrVDCd.observe(document.getElementById('testSwrzsrVDCd'));});</script>",
          },
        ]),
      ),
    );
  });

  it('tests with no props', () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];
    const result = hydrateComponent({
      ...common,
      hydrateOptions: { loading: 'lazy' },
      page: { hydrateStack, headStack },
      props: {},
    });
    expect(result).toEqual(`<div class="test-component" id="testSwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toEqual([]);
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      expect.arrayContaining(
        removeSpacesFromStack([
          {
            priority: 99,
            source: 'testSwrzsrVDCd',
            string: '<script nomodule defer src="iife" onload="inittestSwrzsrVDCd()"></script>',
          },
          {
            priority: 98,
            source: 'testSwrzsrVDCd',
            string:
              "<script nomodule>function inittestSwrzsrVDCd(){new ___elderjs_test({target: document.getElementById('testSwrzsrVDCd'),props:{},hydrate: true,});}</script>",
          },
          {
            priority: 30,
            source: 'testSwrzsrVDCd',
            string:
              "<script type=\"module\">function inittestSwrzsrVDCd(){import(\"mjs\").then((component)=>{new component.default({target: document.getElementById('testSwrzsrVDCd'),props: {},hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('testSwrzsrVDCd'));if (document.eg_test) {inittestSwrzsrVDCd();} else {document.eg_test = true;inittestSwrzsrVDCd();}}}}, {rootMargin: '200px',threshold: 0});observerSwrzsrVDCd.observe(document.getElementById('testSwrzsrVDCd'));});</script>",
          },
        ]),
      ),
    );
  });

  it(`tests hydrating multiple components, preload, eager, lazy`, () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];

    expect(
      hydrateComponent({
        ...common,
        componentName: 'preload',
        hydrateOptions: { preload: true },
        page: { hydrateStack, headStack },
      }),
    ).toEqual(`<div class="preload-component" id="preloadSwrzsrVDCd">componentHtml</div>`);
    expect(
      hydrateComponent({
        ...common,
        componentName: 'eager',
        hydrateOptions: { loading: 'eager' },
        page: { hydrateStack, headStack },
      }),
    ).toEqual(`<div class="eager-component" id="eagerSwrzsrVDCd">componentHtml</div>`);

    expect(
      hydrateComponent({
        ...common,
        componentName: 'lazy',
        hydrateOptions: { loading: 'lazy' },
        page: { hydrateStack, headStack },
      }),
    ).toEqual(`<div class="lazy-component" id="lazySwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toEqual([
      { priority: 50, source: 'preload', string: '<link rel="preload" href="mjs" as="script">' },
    ]);
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      removeSpacesFromStack([
        {
          priority: 100,
          source: 'preloadSwrzsrVDCd',
          string: '<script>var preloadPropsSwrzsrVDCd = {a:"b"};</script>',
        },
        {
          priority: 99,
          source: 'preloadSwrzsrVDCd',
          string: '<script nomodule defer src="iife" onload="initpreloadSwrzsrVDCd()"></script>',
        },
        {
          priority: 98,
          source: 'preloadSwrzsrVDCd',
          string:
            "<script nomodule>function initpreloadSwrzsrVDCd(){new ___elderjs_preload({target: document.getElementById('preloadSwrzsrVDCd'),props:preloadPropsSwrzsrVDCd,hydrate: true,});}</script>",
        },
        {
          priority: 30,
          source: 'preloadSwrzsrVDCd',
          string:
            "<script type=\"module\">function initpreloadSwrzsrVDCd(){import(\"mjs\").then((component)=>{new component.default({target: document.getElementById('preloadSwrzsrVDCd'),props: preloadPropsSwrzsrVDCd,hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('preloadSwrzsrVDCd'));if (document.eg_preload) {initpreloadSwrzsrVDCd();} else {document.eg_preload = true;initpreloadSwrzsrVDCd();}}}}, {rootMargin: '200px',threshold: 0});observerSwrzsrVDCd.observe(document.getElementById('preloadSwrzsrVDCd'));});</script>",
        },
        { priority: 100, source: 'eagerSwrzsrVDCd', string: '<script>var eagerPropsSwrzsrVDCd = {a:"b"};</script>' },
        {
          priority: 99,
          source: 'eagerSwrzsrVDCd',
          string: '<script nomodule defer src="iife" onload="initeagerSwrzsrVDCd()"></script>',
        },
        {
          priority: 98,
          source: 'eagerSwrzsrVDCd',
          string:
            "<script nomodule>function initeagerSwrzsrVDCd(){new ___elderjs_eager({target: document.getElementById('eagerSwrzsrVDCd'),props:eagerPropsSwrzsrVDCd,hydrate: true,});}</script>",
        },
        {
          priority: 30,
          source: 'eagerSwrzsrVDCd',
          string:
            '<script type="module">function initeagerSwrzsrVDCd(){import("mjs").then((component)=>{new component.default({target: document.getElementById(\'eagerSwrzsrVDCd\'),props: eagerPropsSwrzsrVDCd,hydrate: true});});}initeagerSwrzsrVDCd();</script>',
        },
        { priority: 100, source: 'lazySwrzsrVDCd', string: '<script>var lazyPropsSwrzsrVDCd = {a:"b"};</script>' },
        {
          priority: 99,
          source: 'lazySwrzsrVDCd',
          string: '<script nomodule defer src="iife" onload="initlazySwrzsrVDCd()"></script>',
        },
        {
          priority: 98,
          source: 'lazySwrzsrVDCd',
          string:
            "<script nomodule>function initlazySwrzsrVDCd(){new ___elderjs_lazy({target: document.getElementById('lazySwrzsrVDCd'),props:lazyPropsSwrzsrVDCd,hydrate: true,});}</script>",
        },
        {
          priority: 30,
          source: 'lazySwrzsrVDCd',
          string:
            "<script type=\"module\">function initlazySwrzsrVDCd(){import(\"mjs\").then((component)=>{new component.default({target: document.getElementById('lazySwrzsrVDCd'),props: lazyPropsSwrzsrVDCd,hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('lazySwrzsrVDCd'));if (document.eg_lazy) {initlazySwrzsrVDCd();} else {document.eg_lazy = true;initlazySwrzsrVDCd();}}}}, {rootMargin: '200px',threshold: 0});observerSwrzsrVDCd.observe(document.getElementById('lazySwrzsrVDCd'));});</script>",
        },
      ]),
    );
  });

  it(`tests hydrating multiple components, 'eager' + preload: true, eager, lazy`, () => {
    // eslint-disable-next-line global-require
    const { default: hydrateComponent } = require('../hydrateComponent');
    const hydrateStack = [];
    const headStack = [];

    expect(
      hydrateComponent({
        ...common,
        componentName: 'preload-eager',
        hydrateOptions: { preload: true, loading: 'eager' },
        page: { hydrateStack, headStack },
      }),
    ).toEqual(`<div class="preload-eager-component" id="preload-eagerSwrzsrVDCd">componentHtml</div>`);
    expect(
      hydrateComponent({
        ...common,
        componentName: 'eager',
        hydrateOptions: { loading: 'eager' },
        page: { hydrateStack, headStack },
      }),
    ).toEqual(`<div class="eager-component" id="eagerSwrzsrVDCd">componentHtml</div>`);

    expect(
      hydrateComponent({
        ...common,
        componentName: 'lazy',
        hydrateOptions: { loading: 'lazy' },
        page: { hydrateStack, headStack },
      }),
    ).toEqual(`<div class="lazy-component" id="lazySwrzsrVDCd">componentHtml</div>`);
    expect(removeSpacesFromStack(headStack)).toEqual([
      { priority: 50, source: 'preload-eager', string: '<link rel="preload" href="mjs" as="script">' },
    ]);
    expect(removeSpacesFromStack(hydrateStack)).toStrictEqual(
      removeSpacesFromStack([
        {
          priority: 100,
          source: 'preload-eagerSwrzsrVDCd',
          string: '<script>var preload-eagerPropsSwrzsrVDCd = {a:"b"};</script>',
        },
        {
          priority: 99,
          source: 'preload-eagerSwrzsrVDCd',
          string: '<script nomodule defer src="iife" onload="initpreload-eagerSwrzsrVDCd()"></script>',
        },
        {
          priority: 98,
          source: 'preload-eagerSwrzsrVDCd',
          string:
            "<script nomodule>function initpreload-eagerSwrzsrVDCd(){new ___elderjs_preload-eager({target: document.getElementById('preload-eagerSwrzsrVDCd'),props:preload-eagerPropsSwrzsrVDCd,hydrate: true,});}</script>",
        },
        {
          priority: 30,
          source: 'preload-eagerSwrzsrVDCd',
          string:
            '<script type="module">function initpreload-eagerSwrzsrVDCd(){import("mjs").then((component)=>{new component.default({target: document.getElementById(\'preload-eagerSwrzsrVDCd\'),props: preload-eagerPropsSwrzsrVDCd,hydrate: true});});}initpreload-eagerSwrzsrVDCd();</script>',
        },
        { priority: 100, source: 'eagerSwrzsrVDCd', string: '<script>var eagerPropsSwrzsrVDCd = {a:"b"};</script>' },
        {
          priority: 99,
          source: 'eagerSwrzsrVDCd',
          string: '<script nomodule defer src="iife" onload="initeagerSwrzsrVDCd()"></script>',
        },
        {
          priority: 98,
          source: 'eagerSwrzsrVDCd',
          string:
            "<script nomodule>function initeagerSwrzsrVDCd(){new ___elderjs_eager({target: document.getElementById('eagerSwrzsrVDCd'),props:eagerPropsSwrzsrVDCd,hydrate: true,});}</script>",
        },
        {
          priority: 30,
          source: 'eagerSwrzsrVDCd',
          string:
            '<script type="module">function initeagerSwrzsrVDCd(){import("mjs").then((component)=>{new component.default({target: document.getElementById(\'eagerSwrzsrVDCd\'),props: eagerPropsSwrzsrVDCd,hydrate: true});});}initeagerSwrzsrVDCd();</script>',
        },
        { priority: 100, source: 'lazySwrzsrVDCd', string: '<script>var lazyPropsSwrzsrVDCd = {a:"b"};</script>' },
        {
          priority: 99,
          source: 'lazySwrzsrVDCd',
          string: '<script nomodule defer src="iife" onload="initlazySwrzsrVDCd()"></script>',
        },
        {
          priority: 98,
          source: 'lazySwrzsrVDCd',
          string:
            "<script nomodule>function initlazySwrzsrVDCd(){new ___elderjs_lazy({target: document.getElementById('lazySwrzsrVDCd'),props:lazyPropsSwrzsrVDCd,hydrate: true,});}</script>",
        },
        {
          priority: 30,
          source: 'lazySwrzsrVDCd',
          string:
            "<script type=\"module\">function initlazySwrzsrVDCd(){import(\"mjs\").then((component)=>{new component.default({target: document.getElementById('lazySwrzsrVDCd'),props: lazyPropsSwrzsrVDCd,hydrate: true});});}window.addEventListener('load', function (event) {var observerSwrzsrVDCd = new IntersectionObserver(function(entries, observer) {var objK = Object.keys(entries);var objKl = objK.length;var objKi = 0;for (; objKi < objKl; objKi++) {var entry = entries[objK[objKi]];if (entry.isIntersecting) {observer.unobserve(document.getElementById('lazySwrzsrVDCd'));if (document.eg_lazy) {initlazySwrzsrVDCd();} else {document.eg_lazy = true;initlazySwrzsrVDCd();}}}}, {rootMargin: '200px',threshold: 0});observerSwrzsrVDCd.observe(document.getElementById('lazySwrzsrVDCd'));});</script>",
        },
      ]),
    );
  });
});
