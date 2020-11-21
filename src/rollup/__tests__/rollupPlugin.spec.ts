import path from 'path';

import fsExtra from 'fs-extra';
import {
  encodeSourceMap,
  getDependencies,
  cssFilePriority,
  sortCss,
  getCssFromCache,
  logDependency,
  load,
} from '../rollupPlugin';

describe('#rollupPlugin', () => {
  describe('#encodeSourceMap', () => {
    it('properly generates an encoded string', () => {
      const m = {
        toString: () => {
          return 'Im stringy';
        },
      };
      expect(encodeSourceMap(m)).toBe(
        '/*# sourceMappingURL=data:application/json;charset=utf-8;base64,SW0gc3RyaW5neQ== */',
      );
    });
    it('returns empty when undefined', () => {
      expect(encodeSourceMap(undefined)).toBe('');
    });
    it('returns empty when no toString', () => {
      expect(encodeSourceMap(NaN)).toBe('');
    });
  });

  describe('#cssFilePriority', () => {
    it('properly maps components', () => {
      expect(cssFilePriority('foo/bar/src/components')).toBe(1);
    });
    it('properly maps routes', () => {
      expect(cssFilePriority('foo/bar/src/routes')).toBe(2);
    });
    it('properly maps layouts', () => {
      expect(cssFilePriority('foo/bar/src/layouts')).toBe(3);
    });
    it('properly maps something unknown', () => {
      expect(cssFilePriority('foo/barasdfasdfasdfasdfasda')).toBe(0);
    });
  });

  describe('#logDependency', () => {
    it('It adds a css file as a dependency when it is imported.', () => {
      const cache = {
        dependencies: {},
      };
      logDependency('/test/src/style.css', '/test/src/routes/home/home.svelte', cache);
      expect(cache).toEqual({
        dependencies: {
          '/test/src/routes/home/home.svelte': new Set(['/test/src/style.css']),
        },
      });
    });
    it('It adds the importee as the dependency of the importer', () => {
      const cache = {
        dependencies: {},
      };
      logDependency('/test/src/components/AutoComplete.svelte', '/test/src/components/AutoCompleteHome.svelte', cache);
      expect(cache).toEqual({
        dependencies: {
          '/test/src/components/AutoCompleteHome.svelte': new Set(['/test/src/components/AutoComplete.svelte']),
        },
      });
    });
  });

  describe('#getDependencies', () => {
    it('finds deep dependencies', () => {
      const cache1 = {
        dependencies: {},
      };
      logDependency('/test/src/components/AutoComplete.svelte', '/test/src/components/AutoCompleteHome.svelte', cache1);
      logDependency('/test/src/components/AutoCompleteHome.svelte', '/test/src/components/Deeper.svelte', cache1);
      logDependency('/test/src/components/Deeper.svelte', '/test/src/components/Deepest.svelte', cache1);
      const deps = getDependencies('/test/src/components/Deepest.svelte', cache1);
      expect(deps).toEqual([
        '/test/src/components/Deepest.svelte',
        '/test/src/components/Deeper.svelte',
        '/test/src/components/AutoCompleteHome.svelte',
        '/test/src/components/AutoComplete.svelte',
      ]);
    });
    it("doesn't crash on circular deps", () => {
      const cache2 = {
        dependencies: {},
      };
      logDependency('/test/src/components/Deeper.svelte', '/test/src/components/Circular.svelte', cache2);
      logDependency('/test/src/components/Circular.svelte', '/test/src/components/Circular.svelte', cache2);
      const deps = getDependencies('/test/src/components/Circular.svelte', cache2);
      expect(deps).toEqual(['/test/src/components/Circular.svelte', '/test/src/components/Deeper.svelte']);
    });

    it('Finds proper deps and not additional ones', () => {
      const cache3 = {
        dependencies: {},
      };
      logDependency('/test/src/components/AutoComplete.svelte', '/test/src/components/AutoCompleteHome.svelte', cache3);
      logDependency('/test/src/components/AutoCompleteHome.svelte', '/test/src/components/Deeper.svelte', cache3);
      logDependency('/test/src/components/Deeper.svelte', '/test/src/components/Circular.svelte', cache3);
      logDependency('/test/src/components/Dep.svelte', '/test/src/components/Single.svelte', cache3);
      const deps = getDependencies('/test/src/components/Single.svelte', cache3);
      expect(deps).toEqual(['/test/src/components/Single.svelte', '/test/src/components/Dep.svelte']);
    });

    it('Finds no deps when there are none', () => {
      const cache4 = {
        dependencies: {},
      };
      logDependency('/test/src/components/AutoComplete.svelte', '/test/src/components/AutoCompleteHome.svelte', cache4);
      logDependency('/test/src/components/AutoCompleteHome.svelte', '/test/src/components/Deeper.svelte', cache4);
      const deps = getDependencies('/test/src/components/wtf.svelte', cache4);
      expect(deps).toEqual(['/test/src/components/wtf.svelte']);
    });
  });

  describe('#sortCss', () => {
    it('sorts by priority', () => {
      const css = [
        [
          'one',
          {
            priority: 1,
            code: '1',
            map: 'map1',
          },
        ],
        [
          'two',
          {
            priority: 2,
            code: '2',
            map: 'map2',
          },
        ],
        [
          'three',
          {
            priority: 3,
            code: '3',
            map: 'map3',
          },
        ],
        [
          'four',
          {
            priority: 4,
            code: '4',
            map: 'map4',
          },
        ],
        [
          'five',
          {
            priority: 5,
            code: '5',
            map: 'map5',
          },
        ],
      ];
      expect(sortCss(css)).toStrictEqual([
        { one: { sourceMap: 'map1', styles: '1' } },
        { two: { sourceMap: 'map2', styles: '2' } },
        { three: { sourceMap: 'map3', styles: '3' } },
        { four: { sourceMap: 'map4', styles: '4' } },
        { five: { sourceMap: 'map5', styles: '5' } },
      ]);
    });
  });

  describe('shared', () => {
    const files = [
      '/test/src/components/AutoComplete.svelte',
      '/test/src/components/AutoCompleteHome.svelte',
      '/test/src/components/Deeper.svelte',
      '/test/src/components/Circular.svelte',
      '/test/src/routes/Dep.svelte',
      '/test/src/layouts/Single.svelte',
    ];

    const cssCache = new Map();
    const cache = {
      dependencies: {},
    };

    function createCss(str) {
      cssCache.set(`css${str}`, {
        code: str,
        map: str,
        priority: cssFilePriority(str),
      });
    }

    files.forEach((file, i, arr) => {
      createCss(file);
      if (i < arr.length - 2) {
        logDependency(file, arr[i + 1], cache);
      }
    });
    it('validates the testing env is correct', () => {
      expect([...cssCache.entries()]).toStrictEqual([
        [
          'css/test/src/components/AutoComplete.svelte',
          {
            code: '/test/src/components/AutoComplete.svelte',
            map: '/test/src/components/AutoComplete.svelte',
            priority: 1,
          },
        ],
        [
          'css/test/src/components/AutoCompleteHome.svelte',
          {
            code: '/test/src/components/AutoCompleteHome.svelte',
            map: '/test/src/components/AutoCompleteHome.svelte',
            priority: 1,
          },
        ],
        [
          'css/test/src/components/Deeper.svelte',
          { code: '/test/src/components/Deeper.svelte', map: '/test/src/components/Deeper.svelte', priority: 1 },
        ],
        [
          'css/test/src/components/Circular.svelte',
          { code: '/test/src/components/Circular.svelte', map: '/test/src/components/Circular.svelte', priority: 1 },
        ],
        [
          'css/test/src/routes/Dep.svelte',
          { code: '/test/src/routes/Dep.svelte', map: '/test/src/routes/Dep.svelte', priority: 2 },
        ],
        [
          'css/test/src/layouts/Single.svelte',
          { code: '/test/src/layouts/Single.svelte', map: '/test/src/layouts/Single.svelte', priority: 3 },
        ],
      ]);
      expect(cache.dependencies).toEqual({
        '/test/src/components/AutoCompleteHome.svelte': new Set(['/test/src/components/AutoComplete.svelte']),
        '/test/src/components/Circular.svelte': new Set(['/test/src/components/Deeper.svelte']),
        '/test/src/components/Deeper.svelte': new Set(['/test/src/components/AutoCompleteHome.svelte']),
        '/test/src/routes/Dep.svelte': new Set(['/test/src/components/Circular.svelte']),
      });
    });

    describe('#getCssFromCache', () => {
      it('takes an array of 1 and gets items from the cache', () => {
        expect(getCssFromCache(['/test/src/components/AutoCompleteHome.svelte'], cssCache)).toEqual([
          [
            '/test/src/components/AutoCompleteHome.svelte',
            {
              code: '/test/src/components/AutoCompleteHome.svelte',
              map: '/test/src/components/AutoCompleteHome.svelte',
              priority: 1,
            },
          ],
        ]);
      });
      it('takes an array of several and gets items from the cache', () => {
        expect(getCssFromCache(files.slice(0, 3), cssCache)).toEqual([
          [
            '/test/src/components/AutoComplete.svelte',
            {
              code: '/test/src/components/AutoComplete.svelte',
              map: '/test/src/components/AutoComplete.svelte',
              priority: 1,
            },
          ],
          [
            '/test/src/components/AutoCompleteHome.svelte',
            {
              code: '/test/src/components/AutoCompleteHome.svelte',
              map: '/test/src/components/AutoCompleteHome.svelte',
              priority: 1,
            },
          ],
          [
            '/test/src/components/Deeper.svelte',
            { code: '/test/src/components/Deeper.svelte', map: '/test/src/components/Deeper.svelte', priority: 1 },
          ],
        ]);
      });
    });
    it('#load', () => {
      const o = {
        cache: {
          set: jest.fn((id) => {
            console.log('set', id);
          }),
        },
      };

      const loadBound = load.bind(o);
      loadBound(path.resolve(process.cwd(), './test.css'));
      expect(o.cache.set).toHaveBeenCalledTimes(1);
    });
  });
});
