/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
import path from 'path';

import fsExtra from 'fs-extra';
import del from 'del';
import elderjsRollup, {
  encodeSourceMap,
  getDependencies,
  cssFilePriority,
  sortCss,
  getCssFromCache,
  logDependency,
  load,
} from '../rollupPlugin';
import windowsPathFix from '../../utils/windowsPathFix';
import normalizeSnapshot from '../../utils/normalizeSnapshot';
import getConfig from '../../utils/getConfig';

jest.mock('del');

describe('#rollupPlugin', () => {
  const cfs = fsExtra.copyFileSync;
  const rds = fsExtra.readdirSync;
  const eds = fsExtra.ensureDirSync;

  // @ts-ignore
  fsExtra.copyFileSync = jest.fn(cfs);
  // @ts-ignore
  fsExtra.copyFileSync.mockImplementation(() => 'copied');
  // @ts-ignore
  fsExtra.readdirSync = jest.fn(rds);
  // @ts-ignore
  fsExtra.readdirSync.mockImplementation(() => ['style.css', 'style.css.map']);
  // @ts-ignore
  fsExtra.ensureDirSync = jest.fn(eds);
  // @ts-ignore
  fsExtra.ensureDirSync.mockImplementation(console.log);
  // @ts-ignore

  const elderConfig = getConfig();

  fsExtra.copyFileSync = cfs;
  fsExtra.readdirSync = rds;
  fsExtra.ensureDirSync = eds;

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

    it('properly node_modules layouts', () => {
      expect(cssFilePriority('/blah/foo/node_modules/bloo/boo')).toBe(6);
    });
    it('properly maps something unknown', () => {
      expect(cssFilePriority('foo/barasdfasdfasdfasdfasda')).toBe(0);
    });
  });

  describe('#logDependency', () => {
    it('adds a css file as a dependency when it is imported.', () => {
      const cache = {
        dependencies: {},
      };

      const importee = path.resolve('./test/src/style.css');
      const importer = path.resolve('./test/src/routes/home/home.svelte');
      const expected = {};
      expected[importer] = new Set([importee]);

      logDependency(importee, importer, cache);
      expect(normalizeSnapshot(cache.dependencies)).toEqual(normalizeSnapshot(expected));
    });
    it('adds the importee as the dependency of the importer', () => {
      const cache = {
        dependencies: {},
      };

      const importee = path.resolve('./test/src/components/AutoComplete.svelte');
      const importer = path.resolve('./test/src/components/AutoCompleteHome.svelte');
      const expected = {};
      expected[importer] = new Set([importee]);

      logDependency(importee, importer, cache);
      expect(normalizeSnapshot(cache.dependencies)).toEqual(normalizeSnapshot(expected));
    });
    it('Properly attributes external npm packages', () => {
      const cache = {
        dependencies: {},
      };

      logDependency(
        path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte`),
        undefined,
        cache,
      );

      logDependency(
        `svelte/internal`,
        path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte`),
        cache,
      );

      logDependency(
        `test-external-svelte-library`,
        path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte`),
        cache,
      );

      logDependency(
        path.resolve(
          `./src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/index.js`,
        ),
        `test-external-svelte-library`,
        cache,
      );

      logDependency(
        `../components/Component.svelte`,
        path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte`),
        cache,
      );

      logDependency(
        `test-external-svelte-library/src/components/Button.svelte`,
        path.resolve(
          `./src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/index.js`,
        ),
        cache,
      );

      logDependency(
        `svelte/internal`,
        path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/components/Component.svelte`),
        cache,
      );

      logDependency(
        `svelte/internal`,
        path.resolve(
          `./src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/components/Button.svelte`,
        ),
        cache,
      );

      logDependency(
        `../components/Icon.svelte`,
        path.resolve(
          `./src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/components/Button.svelte`,
        ),
        cache,
      );

      logDependency(
        `svelte/internal`,
        path.resolve(
          `./src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/components/Icon.svelte`,
        ),
        cache,
      );

      expect(
        getDependencies(
          path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte`),
          cache,
        ),
      ).toEqual([
        path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte`),
        'test-external-svelte-library',
        path.resolve(
          './src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/index.js',
        ),
        path.resolve(
          './src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/test-external-svelte-library/src/components/Button.svelte',
        ),
        path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/components/Component.svelte`),
      ]);

      const abs = {
        './src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte': new Set([
          'test-external-svelte-library',
          './src/rollup/__tests__/__fixtures__/external/src/components/Component.svelte',
        ]),
        'test-external-svelte-library': new Set([
          './src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/index.js',
        ]),
        './src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/index.js': new Set([
          './src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/test-external-svelte-library/src/components/Button.svelte',
        ]),
        './src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/components/Button.svelte': new Set(
          [
            './src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/components/Icon.svelte',
          ],
        ),
      };

      const cleanPath = (str) => (str[0] === '.' ? path.resolve(str) : str);
      const rel = Object.entries(abs).reduce((out, cv) => {
        out[cleanPath(cv[0])] = new Set([...cv[1].values()].map(cleanPath));
        return out;
      }, {});

      expect(cache.dependencies).toEqual(rel);
    });
  });

  describe('#getDependencies', () => {
    it('finds deep dependencies', () => {
      const cache1 = {
        dependencies: {},
      };
      logDependency(
        path.resolve(`./test/src/components/AutoComplete.svelte`),
        path.resolve(`./test/src/components/AutoCompleteHome.svelte`),
        cache1,
      );
      logDependency(
        path.resolve(`./test/src/components/AutoCompleteHome.svelte`),
        path.resolve(`./test/src/components/Deeper.svelte`),
        cache1,
      );
      logDependency(
        path.resolve(`./test/src/components/Deeper.svelte`),
        path.resolve(`./test/src/components/Deepest.svelte`),
        cache1,
      );
      const deps = getDependencies(path.resolve(`./test/src/components/Deepest.svelte`), cache1);
      expect(normalizeSnapshot(deps)).toEqual(
        normalizeSnapshot([
          path.resolve(`./test/src/components/Deepest.svelte`),
          path.resolve(`./test/src/components/Deeper.svelte`),
          path.resolve(`./test/src/components/AutoCompleteHome.svelte`),
          path.resolve(`./test/src/components/AutoComplete.svelte`),
        ]),
      );
    });
    it("doesn't crash on circular deps", () => {
      const cache2 = {
        dependencies: {},
      };
      logDependency(
        path.resolve(`./test/src/components/Deeper.svelte`),
        path.resolve(`./test/src/components/Circular.svelte`),
        cache2,
      );
      logDependency(
        path.resolve(`./test/src/components/Circular.svelte`),
        path.resolve(`./test/src/components/Circular.svelte`),
        cache2,
      );
      const deps = getDependencies(path.resolve(`./test/src/components/Circular.svelte`), cache2);
      expect(normalizeSnapshot(deps)).toEqual(
        normalizeSnapshot([
          path.resolve(`./test/src/components/Circular.svelte`),
          path.resolve(`./test/src/components/Deeper.svelte`),
        ]),
      );
    });

    it(`Finds proper deps and not additional ones`, () => {
      const cache3 = {
        dependencies: {},
      };
      logDependency(
        path.resolve(`./test/src/components/AutoComplete.svelte`),
        path.resolve(`./test/src/components/AutoCompleteHome.svelte`),
        cache3,
      );
      logDependency(
        path.resolve(`./test/src/components/AutoCompleteHome.svelte`),
        path.resolve(`./test/src/components/Deeper.svelte`),
        cache3,
      );
      logDependency(
        path.resolve(`./test/src/components/Deeper.svelte`),
        path.resolve(`./test/src/components/Circular.svelte`),
        cache3,
      );
      logDependency(
        path.resolve(`./test/src/components/Dep.svelte`),
        path.resolve(`./test/src/components/Single.svelte`),
        cache3,
      );
      const deps = getDependencies(path.resolve(`./test/src/components/Single.svelte`), cache3);
      expect(normalizeSnapshot(deps)).toEqual(
        normalizeSnapshot([
          path.resolve(`./test/src/components/Single.svelte`),
          path.resolve(`./test/src/components/Dep.svelte`),
        ]),
      );
    });

    it(`Finds no deps when there are none`, () => {
      const cache4 = {
        dependencies: {},
      };
      logDependency(
        path.resolve(`./test/src/components/AutoComplete.svelte`),
        path.resolve(`./test/src/components/AutoCompleteHome.svelte`),
        cache4,
      );
      logDependency(
        path.resolve(`./test/src/components/AutoCompleteHome.svelte`),
        path.resolve(`./test/src/components/Deeper.svelte`),
        cache4,
      );
      const deps = getDependencies(path.resolve(`./test/src/components/wtf.svelte`), cache4);
      expect(normalizeSnapshot(deps)).toEqual(normalizeSnapshot([path.resolve(`./test/src/components/wtf.svelte`)]));
    });
  });

  describe('#sortCss', () => {
    it('sorts by priority from highest to lowest... (highest prio is first in the doc)', () => {
      const css = [
        [
          'five',
          {
            priority: 5,
            code: '5',
            map: 'map5',
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
          'three',
          {
            priority: 3,
            code: '3',
            map: 'map3',
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
          'one',
          {
            priority: 1,
            code: '1',
            map: 'map1',
          },
        ],
      ];
      expect(sortCss(css)).toStrictEqual([
        { five: { sourceMap: 'map5', styles: '5' } },
        { four: { sourceMap: 'map4', styles: '4' } },
        { three: { sourceMap: 'map3', styles: '3' } },
        { two: { sourceMap: 'map2', styles: '2' } },
        { one: { sourceMap: 'map1', styles: '1' } },
      ]);
    });
  });

  describe('shared', () => {
    const files = normalizeSnapshot([
      path.resolve(`./test/src/components/AutoComplete.svelte`),
      path.resolve(`./test/src/components/AutoCompleteHome.svelte`),
      path.resolve(`./test/src/components/Deeper.svelte`),
      path.resolve(`./test/src/components/Circular.svelte`),
      path.resolve(`./test/src/routes/Dep.svelte`),
      path.resolve(`./test/src/layouts/Single.svelte`),
    ]);

    const cssCache = new Map();
    const rollupCache = {
      dependencies: {},
    };

    function createCss(str) {
      const normalized = windowsPathFix(str);
      cssCache.set(`css${normalized}`, {
        code: `.content{content:"${normalized}"}`,
        map: undefined,
        priority: cssFilePriority(normalized),
      });
    }

    files.forEach((file, i, arr) => {
      createCss(file);
      if (i < arr.length - 2) {
        logDependency(file, arr[i + 1], rollupCache);
      }
    });
    it('validates the testing env is correct', () => {
      expect([...cssCache.entries()]).toStrictEqual(
        normalizeSnapshot([
          [
            `css${path.resolve('./test/src/components/AutoComplete.svelte')}`,
            {
              code: `.content{content:"${path.resolve('./test/src/components/AutoComplete.svelte')}"}`,
              map: undefined,
              priority: 1,
            },
          ],
          [
            `css${path.resolve('./test/src/components/AutoCompleteHome.svelte')}`,
            {
              code: `.content{content:"${path.resolve('./test/src/components/AutoCompleteHome.svelte')}"}`,
              map: undefined,
              priority: 1,
            },
          ],
          [
            `css${path.resolve('./test/src/components/Deeper.svelte')}`,
            {
              code: `.content{content:"${path.resolve('./test/src/components/Deeper.svelte')}"}`,
              map: undefined,
              priority: 1,
            },
          ],
          [
            `css${path.resolve('./test/src/components/Circular.svelte')}`,
            {
              code: `.content{content:"${path.resolve('./test/src/components/Circular.svelte')}"}`,
              map: undefined,
              priority: 1,
            },
          ],
          [
            `css${path.resolve('./test/src/routes/Dep.svelte')}`,
            {
              code: `.content{content:"${path.resolve('./test/src/routes/Dep.svelte')}"}`,
              map: undefined,
              priority: 2,
            },
          ],
          [
            `css${path.resolve('./test/src/layouts/Single.svelte')}`,
            {
              code: `.content{content:"${path.resolve('./test/src/layouts/Single.svelte')}"}`,
              map: undefined,
              priority: 3,
            },
          ],
        ]),
      );

      const expected = {};

      expected[path.resolve('./test/src/components/AutoCompleteHome.svelte')] = new Set([
        path.resolve('./test/src/components/AutoComplete.svelte'),
      ]);
      expected[path.resolve('./test/src/components/Circular.svelte')] = new Set([
        path.resolve('./test/src/components/Deeper.svelte'),
      ]);
      expected[path.resolve('./test/src/components/Deeper.svelte')] = new Set([
        path.resolve('./test/src/components/AutoCompleteHome.svelte'),
      ]);
      expected[path.resolve('./test/src/routes/Dep.svelte')] = new Set([
        path.resolve('./test/src/components/Circular.svelte'),
      ]);

      expect(normalizeSnapshot(rollupCache.dependencies)).toEqual(normalizeSnapshot(expected));
    });

    describe('#getCssFromCache', () => {
      it('takes an array of 1 and gets items from the cache', () => {
        expect(
          normalizeSnapshot(
            getCssFromCache([windowsPathFix(path.resolve('./test/src/components/AutoCompleteHome.svelte'))], cssCache),
          ),
        ).toEqual(
          normalizeSnapshot([
            [
              path.resolve('./test/src/components/AutoCompleteHome.svelte'),
              {
                code: `.content{content:"${path.resolve('./test/src/components/AutoCompleteHome.svelte')}"}`,
                map: undefined,
                priority: 1,
              },
            ],
          ]),
        );
      });
      it('takes an array of several and gets items from the cache', () => {
        expect(normalizeSnapshot(getCssFromCache(files.slice(0, 3).map(windowsPathFix), cssCache))).toEqual(
          normalizeSnapshot([
            [
              path.resolve('./test/src/components/AutoComplete.svelte'),
              {
                code: `.content{content:"${path.resolve('./test/src/components/AutoComplete.svelte')}"}`,
                map: undefined,
                priority: 1,
              },
            ],
            [
              path.resolve('./test/src/components/AutoCompleteHome.svelte'),
              {
                code: `.content{content:"${path.resolve('./test/src/components/AutoCompleteHome.svelte')}"}`,
                map: undefined,
                priority: 1,
              },
            ],
            [
              path.resolve('./test/src/components/Deeper.svelte'),
              {
                code: `.content{content:"${path.resolve('./test/src/components/Deeper.svelte')}"}`,
                map: undefined,
                priority: 1,
              },
            ],
          ]),
        );
      });
    });
    describe('#elderjsRollup', () => {
      it('#load', () => {
        const rfs = fsExtra.readFileSync;
        // @ts-ignore
        fsExtra.readFileSync = jest.fn(rfs).mockImplementation(() => 'mock');

        const o = {
          cache: {
            values: [],
            set: jest.fn((id) => {
              o.cache.values.push(id);
            }),
          },
        };

        const loadBound = load.bind(o);
        expect(loadBound(path.resolve(process.cwd(), './test.css'))).toBe('');
        expect(o.cache.set).toHaveBeenCalledTimes(1);
        expect(o.cache.values).toEqual([`css${path.resolve('./test.css')}`]);
        fsExtra.readFileSync = rfs;
      });

      const shared = {
        elderConfig,

        legacy: false,
        svelteConfig: {},
      };

      const ssrPlugin = elderjsRollup({
        ...shared,
        type: 'ssr',
      });

      const clientPlugin = elderjsRollup({
        ...shared,
        type: 'client',
      });

      // non crappy mocks: https://gist.githubusercontent.com/rickhanlonii/c695cbc51ae6ffd81c46f46509171650/raw/a0b7f851be704b739be76b2543deff577b449fee/mock_jest_spyOn_sugar.js

      describe('#watchChange', () => {
        describe('#buildStart', () => {
          const delsync = del.sync;
          // @ts-ignore
          del.sync = jest.fn(delsync).mockImplementation((pay) => pay);
          del.sync = delsync;
          it('tests ssr functionality', () => {
            const t = {
              values: [],
              emitFile: jest.fn((pay) => {
                t.values.push(pay);
                return pay.name;
              }),
            };

            const buildStartBound = ssrPlugin.buildStart.bind(t);

            buildStartBound();

            expect(t.values).toEqual([{ name: 'svelte.css', type: 'asset' }]);
            expect(del.sync).toHaveBeenCalledTimes(2);
            expect(del.sync).toHaveBeenCalledWith(elderConfig.$$internal.ssrComponents);
            expect(del.sync).toHaveBeenCalledWith(path.join(elderConfig.$$internal.distElder, 'assets'));
          });
          it('tests client functionality', () => {
            const t = {
              values: [],
              emitFile: jest.fn((pay) => {
                t.values.push(pay);
              }),
            };
            const buildStartBound = clientPlugin.buildStart.bind(t);
            buildStartBound();
            expect(t.values).toEqual([]);
            expect(del.sync).toHaveBeenCalledTimes(3);
            expect(del.sync).toHaveBeenCalledWith(elderConfig.$$internal.clientComponents);
            expect(del.sync).toHaveBeenCalledWith(elderConfig.$$internal.ssrComponents);
            expect(del.sync).toHaveBeenCalledWith(path.join(elderConfig.$$internal.distElder, 'assets'));
          });
        });

        describe('#renderChunk', () => {
          it('tests ssr functionality', async () => {
            const t = {
              values: [],
              cache: cssCache,
            };

            const bound = ssrPlugin.renderChunk.bind(t);
            const r = await bound('', { isEntry: true, facadeModuleId: files[0] });
            expect(r.code).toContain(`.content{content`);
            expect(r.code).toContain(`\\u002Felderjs\\u002Ftest\\u002Fsrc\\u002Fcomponents\\u002FAutoComplete.svelte`);
            expect(r.code).toContain('AutoComplete.svelte"]');
          });

          it('tests client functionality', async () => {
            // @ts-ignore
            const r = await clientPlugin.renderChunk('', { isEntry: true }, {});
            expect(r).toBeUndefined();
          });
        });

        describe('#generateBundle', () => {
          it('tests ssr functionality', async () => {
            const t = {
              names: [],
              css: [],
              cache: cssCache,
              getModuleIds: jest.fn(() => files),
              setAssetSource: jest.fn((name, css) => {
                t.names.push(name);
                t.css.push(css);
              }),
            };
            const bound = ssrPlugin.generateBundle.bind(t);
            const r = await bound('', { isEntry: true, facadeModuleId: files[0] });

            expect(t.setAssetSource).toHaveBeenCalledTimes(1);
            expect(t.getModuleIds).toHaveBeenCalledTimes(1);
            expect(t.names).toEqual(['svelte.css']);
            expect(t.css).toEqual(
              normalizeSnapshot([
                `.content{content:"${path.resolve(
                  './test/src/layouts/Single.svelte',
                )}"}.content{content:"${path.resolve('./test/src/routes/Dep.svelte')}"}.content{content:"${path.resolve(
                  './test/src/components/AutoComplete.svelte',
                )}"}.content{content:"${path.resolve(
                  './test/src/components/AutoCompleteHome.svelte',
                )}"}.content{content:"${path.resolve(
                  './test/src/components/Deeper.svelte',
                )}"}.content{content:"${path.resolve('./test/src/components/Circular.svelte')}"}`,
              ]),
            );
            expect(r).toBeUndefined();
          });
        });

        describe('#resolveId', () => {
          it(`doesn't resolve anything not in node_modules`, async () => {
            expect(
              // @ts-ignore
              ssrPlugin.resolveId('../components/Header/Header.svelte', '/test/src/layouts/Layout.svelte'),
            ).toBeNull();
          });

          it(`Resolves a node_module that uses svelte in their package.json`, async () => {
            jest.mock(
              path.resolve('./node_modules/uses-export/package.json'),
              () => ({
                svelte: windowsPathFix('src/Component.svelte'),
              }),
              { virtual: true },
            );
            // @ts-ignore
            expect(ssrPlugin.resolveId('uses-export', path.resolve('./test/src/layouts/Layout.svelte'))).toEqual(
              path.resolve('./node_modules/uses-export/src/Component.svelte'),
            );
          });

          it(`Resolves a node_module that uses svelte and exports their package.json`, async () => {
            jest.mock(
              path.resolve('./node_modules/package-exports/package.json'),
              () => ({
                main: './main.js',
                svelte: windowsPathFix('src/Exported.svelte'),
                exports: {
                  '.': './main.js',
                  './package.json': './package.json',
                },
              }),
              { virtual: true },
            );
            // @ts-ignore
            expect(ssrPlugin.resolveId('package-exports', path.resolve('./test/src/layouts/Layout.svelte'))).toEqual(
              path.resolve('./node_modules/package-exports/src/Exported.svelte'),
            );
          });

          it(`Does not resolve a module that doesn't use svelte in package.json`, async () => {
            jest.mock(
              path.resolve('./node_modules/no-svelte/package.json'),
              () => ({
                main: windowsPathFix('./main.js'),
                exports: {
                  '.': './main.js',
                  './package.json': './package.json',
                },
              }),
              { virtual: true },
            );
            // @ts-ignore
            expect(ssrPlugin.resolveId('no-svelte', path.resolve('./test/src/layouts/Layout.svelte'))).toBeNull();
          });
        });
        describe('#transform', () => {
          it('compiles a svelte component and sets the css while adding to watch files', async () => {
            const t = {
              names: [],
              sets: [],
              cache: {
                has: jest.fn(() => false),
                set: jest.fn((name, pay) => {
                  t.names.push(name);
                  t.sets.push(JSON.stringify(pay));
                }),
              },
              addWatchFile: jest.fn(() => ''),
            };
            const bound = ssrPlugin.transform.bind(t);

            const component = `<script> let foo = 1; </script><style>.container{background: yellow}</style> <div class="container">something</div>`;
            await bound(component, '/test/src/components/tester.svelte');

            expect(t.cache.has).toHaveBeenCalledTimes(1);
            expect(t.cache.set).toHaveBeenCalledTimes(2);
            expect(t.sets[0]).toEqual(
              '{"code":".container.svelte-1sgdt0u{background:yellow}","map":{"version":3,"file":"tester.svelte","sources":["tester.svelte"],"sourcesContent":["<script> let foo = 1; </script><style>.container{background: yellow}</style> <div class=\\"container\\">something</div>"],"names":[],"mappings":"AAAsC,yBAAU,CAAC,UAAU,CAAE,MAAM,CAAC"},"priority":1}',
            );
            expect(t.names).toEqual(['css/test/src/components/tester.svelte', 'f035082291f505923e6b2b9739157357']);
            expect(t.addWatchFile).toHaveBeenCalledTimes(2);
          });
        });

        describe('#writeBundle', () => {
          const cfs = fsExtra.copyFileSync;
          const rds = fsExtra.readdirSync;
          const eds = fsExtra.ensureDirSync;
          it('Sets the dependency cache from prior build', () => {
            const t = {
              cache: {
                set: jest.fn(() => ({})),
              },
            };
            const ssrBound = ssrPlugin.writeBundle.bind(t);

            // @ts-ignore
            fsExtra.copyFileSync = jest.fn(cfs).mockImplementation(() => 'copied');
            // @ts-ignore
            fsExtra.readdirSync = jest.fn(rds).mockImplementation(() => ['style.css', 'style.css.map']);
            // @ts-ignore
            fsExtra.ensureDirSync = jest.fn(eds).mockImplementation();
            ssrBound();

            expect(fsExtra.ensureDirSync).toHaveBeenCalledTimes(1);
            expect(fsExtra.copyFileSync).toHaveBeenCalledTimes(2);
            expect(fsExtra.readdirSync).toHaveBeenCalledTimes(1);

            expect(t.cache.set).toHaveBeenCalledTimes(1);
          });

          it('tests copying assets to client', async () => {
            const t = {
              cache: {
                set: jest.fn(() => ({})),
              },
            };
            const ssrBound = ssrPlugin.writeBundle.bind(t);

            // @ts-ignore
            fsExtra.copyFileSync = jest.fn(cfs).mockImplementation(() => 'copied');
            // @ts-ignore
            fsExtra.readdirSync = jest.fn(rds).mockImplementation(() => ['style.css', 'style.css.map']);
            // @ts-ignore
            fsExtra.ensureDirSync = jest.fn(eds).mockImplementation();
            // @ts-ignore
            await ssrBound({}, {}, true);

            expect(fsExtra.ensureDirSync).toHaveBeenCalledTimes(1);
            expect(fsExtra.copyFileSync).toHaveBeenCalledTimes(2);
            expect(fsExtra.readdirSync).toHaveBeenCalledTimes(1);

            fsExtra.copyFileSync = cfs;
            fsExtra.readdirSync = rds;
            fsExtra.ensureDirSync = eds;
          });
        });
        it('Sets the dependency cache from prior build', () => {
          const t = {
            cache: {
              get: jest.fn(() => ({
                '/foo/': new Set(['/bar/']),
                '/bar/': new Set(['/baz/']),
              })),
            },
          };
          const ssrBound = ssrPlugin.watchChange.bind(t);

          ssrBound('/foo/');

          expect(t.cache.get).toHaveBeenCalledTimes(1);
          expect(t.cache.get).toHaveBeenCalledWith('dependencies');
        });
      });
    });
  });
});
