/* eslint-disable no-return-assign */
import hydrateComponents, { hashCode, howManyBytes } from '../hydrateComponents';
import largeProp from '../__fixtures__/largeProp.json';

let counts = {
  mkdirSync: 0,
  writeFile: 0,
  existsSync: 0,
};
jest.mock('fs-extra', () => ({
  mkdirSync: () => {
    counts.existsSync += 1;
    return true;
  },
  writeFile: async () => {
    counts.writeFile += 1;
    return false;
  },
  existsSync: () => {
    counts.existsSync += 1;
    return false;
  },
}));

const defaultPage = {
  headStack: [],
  hydrateStack: [],
  beforeHydrateStack: [],

  settings: {
    distDir: '/test/',
    $$internal: {
      distElder: '/test/',
    },
    debug: {},
    props: { compress: false, hydration: 'hybrid' },
  },
};

const defaultComponents = [
  {
    name: 'autocompleteZlwFFdKTtG',
    hydrateOptions: { loading: 'lazy' },
    client: '/_elderjs/svelte/components/AutoComplete/AutoComplete.QGDSG3QU.js',
    props: { classes: 'search-form__autocomplete' },
    prepared: {},
    id: 'ZlwFFdKTtG',
  },
  {
    name: 'zoomablemapgYtFjVCDSS',
    hydrateOptions: { loading: 'lazy' },
    client: '/_elderjs/svelte/components/ZoomableMap/ZoomableMap.AOMHQNYN.js',
    props: {
      compress: {
        a: 'b',
        b: 'c',
        c: { a: 'b', b: 'c', c: { a: 'b', b: 'c', c: { apple: false } } },
      },
    },
    prepared: {},
    id: 'gYtFjVCDSS',
  },
  {
    name: 'headerzbmmDtJVlq',
    hydrateOptions: { loading: 'lazy' },
    client: '/_elderjs/svelte/components/Header/Header.AOWJN766.js',
    props: { permalink: '/dev/', server: true },
    prepared: {},
    id: 'zbmmDtJVlq',
  },
];

describe('#hydrateComponents', () => {
  test('#hashCode', () => {
    expect(hashCode('magicHappens')).toBe(-2086468828);
  });
  test('#howManyBytes', () => {
    expect(howManyBytes('{wtf}')).toBe(5);
  });

  describe('#hydrateConpentsCore', () => {
    test('hydrates a components', () => {
      const page = JSON.parse(JSON.stringify(defaultPage));
      page.componentsToHydrate = JSON.parse(JSON.stringify(defaultComponents));

      hydrateComponents(page);
      expect(page.beforeHydrateStack).toHaveLength(1);
      expect(page.hydrateStack).toHaveLength(3);
    });

    test('adds default decompress code', () => {
      const page = JSON.parse(JSON.stringify(defaultPage));
      page.componentsToHydrate = JSON.parse(JSON.stringify(defaultComponents));
      hydrateComponents(page);
      expect(page.beforeHydrateStack[0].string).toEqual('<script>$ejs = function(_ejs){return _ejs}</script>');
    });

    test('adds custom decompress code on propCompression', async () => {
      const page = JSON.parse(JSON.stringify(defaultPage));
      page.componentsToHydrate = JSON.parse(JSON.stringify(defaultComponents));
      page.settings.props.compress = true;
      page.settings.props.replacementChars = '123';
      page.perf = {
        start: () => '',
        stop: () => '',
      };

      await hydrateComponents(page);
      expect(page.beforeHydrateStack[0].string).toEqual(`<script>
      var $ejs = function(){
        var gt = function (_ejs) { return Object.prototype.toString.call(_ejs).slice(8, -1);};
        var ejs = new Map([["1","b"],["2","c"],["3","a"]]);
         return function(_ejs){
            if (ejs.has(_ejs)) return ejs.get(_ejs);
            if (Array.isArray(_ejs)) return _ejs.map((t) => $ejs(t));
            if (gt(_ejs) === "Object") {
            return Object.keys(_ejs).reduce(function (out, cv){
                var key = ejs.get(cv) || cv;
                out[key] = $ejs(_ejs[cv]);
                return out;
              }, {});
            }
            return _ejs;
        };
      }();
    </script>`);
    });

    test('preloads without external prop file', async () => {
      const page = JSON.parse(JSON.stringify(defaultPage));
      page.componentsToHydrate = JSON.parse(JSON.stringify(defaultComponents));
      page.componentsToHydrate[0].hydrateOptions.preload = true;

      await hydrateComponents(page);

      expect(page.headStack[0].string).toEqual(
        `<link rel="preload" href="/_elderjs/svelte/components/AutoComplete/AutoComplete.QGDSG3QU.js" as="script">`,
      );
    });

    test('it writes props to a file in hybrid > 2kb', async () => {
      counts = {
        mkdirSync: 0,
        writeFile: 0,
        existsSync: 0,
      };
      const page = JSON.parse(JSON.stringify(defaultPage));
      page.componentsToHydrate = JSON.parse(JSON.stringify(defaultComponents));
      page.componentsToHydrate[0].props = largeProp;

      const reqHydrateComponents = require('../hydrateComponents');

      await reqHydrateComponents.default(page);

      expect(page.componentsToHydrate[0].prepared.clientPropsUrl).toEqual('/props/ejs-2086035908.js');
      expect(counts).toMatchObject({ existsSync: 3, mkdirSync: 0, writeFile: 1 });
    });

    test('it writes props to a file in file mode', async () => {
      const page = JSON.parse(JSON.stringify(defaultPage));
      page.settings.props.hydration = 'file';
      page.componentsToHydrate = JSON.parse(JSON.stringify(defaultComponents));
      page.componentsToHydrate[0].props = { a: 'b' };

      const reqHydrateComponents = require('../hydrateComponents');

      await reqHydrateComponents.default(page);

      expect(page.componentsToHydrate[0].prepared.clientPropsUrl).toEqual('/props/ejs-1363984429.js');
    });

    test('preloads with external prop file', async () => {
      const page = JSON.parse(JSON.stringify(defaultPage));
      page.settings.props.hydration = 'file';
      page.componentsToHydrate = JSON.parse(JSON.stringify(defaultComponents));
      page.componentsToHydrate[0].hydrateOptions.preload = true;

      const reqHydrateComponents = require('../hydrateComponents');

      await reqHydrateComponents.default(page);

      expect(page.headStack).toMatchObject([
        {
          priority: 50,
          source: 'autocompleteZlwFFdKTtG',
          string:
            '<link rel="preload" href="/_elderjs/svelte/components/AutoComplete/AutoComplete.QGDSG3QU.js" as="script">',
        },
        {
          priority: 49,
          source: 'autocompleteZlwFFdKTtG',
          string: '<link rel="preload" href="/props/ejs--389426143.js" as="script">',
        },
      ]);
    });
  });
});
