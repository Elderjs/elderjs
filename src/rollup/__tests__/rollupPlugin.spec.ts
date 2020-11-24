/* eslint-disable no-param-reassign */
import path from 'path';

import fsExtra from 'fs-extra';
import elderjsRollup, {
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

    it('properly node_modules layouts', () => {
      expect(cssFilePriority('/blah/foo/node_modules/bloo/boo')).toBe(6);
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
        'elderjs/elderjs/src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte': new Set([
          'test-external-svelte-library',
          'elderjs/elderjs/src/rollup/__tests__/__fixtures__/external/src/components/Component.svelte',
        ]),
        'test-external-svelte-library': new Set([
          'elderjs/elderjs/src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/index.js',
        ]),
        'elderjs/elderjs/src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/index.js': new Set(
          [
            'elderjs/elderjs/src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/test-external-svelte-library/src/components/Button.svelte',
          ],
        ),
        'elderjs/elderjs/src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/components/Button.svelte': new Set(
          [
            'elderjs/elderjs/src/rollup/__tests__/__fixtures__/external/node_modules/test-external-svelte-library/src/components/Icon.svelte',
          ],
        ),
      };

      const rel = Object.entries(abs).reduce((out, cv) => {
        // eslint-disable-next-line prefer-destructuring
        out[cv[0].replace('elderjs/elderjs', process.cwd())] = new Set(
          [...cv[1].values()].map((v) => v.replace('elderjs/elderjs', process.cwd())),
        );
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
    const files = [
      '/test/src/components/AutoComplete.svelte',
      '/test/src/components/AutoCompleteHome.svelte',
      '/test/src/components/Deeper.svelte',
      '/test/src/components/Circular.svelte',
      '/test/src/routes/Dep.svelte',
      '/test/src/layouts/Single.svelte',
    ];

    const cssCache = new Map();
    const rollupCache = {
      dependencies: {},
    };

    function createCss(str) {
      cssCache.set(`css${str}`, {
        code: `.content{content:"${str}"}`,
        map: undefined,
        priority: cssFilePriority(str),
      });
    }

    files.forEach((file, i, arr) => {
      createCss(file);
      if (i < arr.length - 2) {
        logDependency(file, arr[i + 1], rollupCache);
      }
    });
    it('validates the testing env is correct', () => {
      expect([...cssCache.entries()]).toStrictEqual([
        [
          'css/test/src/components/AutoComplete.svelte',
          {
            code: `.content{content:"/test/src/components/AutoComplete.svelte"}`,
            map: undefined,
            priority: 1,
          },
        ],
        [
          'css/test/src/components/AutoCompleteHome.svelte',
          {
            code: `.content{content:"/test/src/components/AutoCompleteHome.svelte"}`,
            map: undefined,
            priority: 1,
          },
        ],
        [
          'css/test/src/components/Deeper.svelte',
          {
            code: `.content{content:"/test/src/components/Deeper.svelte"}`,
            map: undefined,
            priority: 1,
          },
        ],
        [
          'css/test/src/components/Circular.svelte',
          {
            code: `.content{content:"/test/src/components/Circular.svelte"}`,
            map: undefined,
            priority: 1,
          },
        ],
        [
          'css/test/src/routes/Dep.svelte',
          { code: '.content{content:"/test/src/routes/Dep.svelte"}', map: undefined, priority: 2 },
        ],
        [
          'css/test/src/layouts/Single.svelte',
          { code: '.content{content:"/test/src/layouts/Single.svelte"}', map: undefined, priority: 3 },
        ],
      ]);
      expect(rollupCache.dependencies).toEqual({
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
              code: '.content{content:"/test/src/components/AutoCompleteHome.svelte"}',
              map: undefined,
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
              code: `.content{content:"/test/src/components/AutoComplete.svelte"}`,
              map: undefined,
              priority: 1,
            },
          ],
          [
            '/test/src/components/AutoCompleteHome.svelte',
            {
              code: `.content{content:"/test/src/components/AutoCompleteHome.svelte"}`,
              map: undefined,
              priority: 1,
            },
          ],
          [
            '/test/src/components/Deeper.svelte',
            {
              code: `.content{content:"/test/src/components/Deeper.svelte"}`,
              map: undefined,
              priority: 1,
            },
          ],
        ]);
      });
    });
    describe('#elderjsRollup', () => {
      it('#load', () => {
        const rfs = fsExtra.readFileSync;
        // @ts-ignore
        fsExtra.readFileSync = jest.fn(rfs);
        // @ts-ignore
        fsExtra.readFileSync.mockImplementation(() => 'mock');

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
        rootDir: path.resolve(process.cwd()),
        distDir: path.resolve(process.cwd(), './public/'),
        distElder: path.resolve(process.cwd(), './public/_elder'),

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

      describe('#buildStart', () => {
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
          expect(
            r.code.indexOf(`.content{content:\\"\\u002Ftest\\u002Fsrc\\u002Fcomponents\\u002FAutoComplete.svelte\\"}`),
          ).toBe(24);
          expect(
            r.code.indexOf(`module.exports._cssIncluded = ["../../../../../test/src/components/AutoComplete.svelte"]`),
          ).toBe(138);
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
          expect(t.css).toEqual([
            '.content{content:"/test/src/layouts/Single.svelte"}.content{content:"/test/src/routes/Dep.svelte"}.content{content:"/test/src/components/AutoComplete.svelte"}.content{content:"/test/src/components/AutoCompleteHome.svelte"}.content{content:"/test/src/components/Deeper.svelte"}.content{content:"/test/src/components/Circular.svelte"}',
          ]);
          expect(r).toBeUndefined();
        });
        it('tests client functionality', async () => {
          const cfs = fsExtra.copyFileSync;
          const rds = fsExtra.readdirSync;
          const eds = fsExtra.ensureDirSync;

          // @ts-ignore
          fsExtra.copyFileSync = jest.fn(cfs).mockImplementation(() => 'copied');
          // @ts-ignore
          fsExtra.readdirSync = jest.fn(rds).mockImplementation(() => ['style.css', 'style.css.map']);
          // @ts-ignore
          fsExtra.ensureDirSync = jest.fn(eds).mockImplementation();
          // @ts-ignore
          await clientPlugin.generateBundle({}, {}, true);

          expect(fsExtra.ensureDirSync).toHaveBeenCalledTimes(1);
          expect(fsExtra.copyFileSync).toHaveBeenCalledTimes(2);
          expect(fsExtra.readdirSync).toHaveBeenCalledTimes(1);

          fsExtra.copyFileSync = cfs;
          fsExtra.readdirSync = rds;
          fsExtra.ensureDirSync = eds;
        });
      });

      describe('#resolveId', () => {
        it(`It doesn't resolve anything not in node_modules`, async () => {
          expect(
            // @ts-ignore
            ssrPlugin.resolveId('../components/Header/Header.svelte', '/test/src/layouts/Layout.svelte'),
          ).toBeNull();
        });

        it(`Resolves a node_module that uses svelte in their package.json`, async () => {
          jest.mock(
            path.resolve('./node_modules/uses-export/package.json'),
            () => ({
              svelte: 'src/Component.svelte',
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
              svelte: 'src/Exported.svelte',
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
              main: './main.js',
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
        it('It compiles a svelte component and sets the css while adding to watch files', async () => {
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
          expect(t.sets).toEqual([
            '{"code":".container.svelte-1sgdt0u{background:yellow}","map":{"version":3,"file":"tester.svelte","sources":["tester.svelte"],"sourcesContent":["<script> let foo = 1; </script><style>.container{background: yellow}</style> <div class=\\"container\\">something</div>"],"names":[],"mappings":"AAAsC,yBAAU,CAAC,UAAU,CAAE,MAAM,CAAC"},"priority":1}',
            // eslint-disable-next-line no-template-curly-in-string
            '{"code":"/* ../../../../../test/src/components/tester.svelte generated by Svelte v3.25.1 */\\nimport { create_ssr_component } from \\"svelte/internal\\";\\n\\nconst css = {\\n\\tcode: \\".container.svelte-1sgdt0u{background:yellow}\\",\\n\\tmap: \\"{\\\\\\"version\\\\\\":3,\\\\\\"file\\\\\\":\\\\\\"tester.svelte\\\\\\",\\\\\\"sources\\\\\\":[\\\\\\"tester.svelte\\\\\\"],\\\\\\"sourcesContent\\\\\\":[\\\\\\"<script> let foo = 1; </script><style>.container{background: yellow}</style> <div class=\\\\\\\\\\\\\\"container\\\\\\\\\\\\\\">something</div>\\\\\\"],\\\\\\"names\\\\\\":[],\\\\\\"mappings\\\\\\":\\\\\\"AAAsC,yBAAU,CAAC,UAAU,CAAE,MAAM,CAAC\\\\\\"}\\"\\n};\\n\\nlet foo = 1;\\n\\nconst Tester = create_ssr_component(($$result, $$props, $$bindings, slots) => {\\n\\t$$result.css.add(css);\\n\\treturn `<div class=\\"${\\"container svelte-1sgdt0u\\"}\\">something</div>`;\\n});\\n\\nexport default Tester;","map":{"version":3,"names":[],"sources":["../../../../../test/src/components/tester.svelte"],"sourcesContent":["<script> let foo = 1; </script><style>.container{background: yellow}</style> <div class=\\"container\\">something</div>"],"mappings":";;;;;;;;IAAa,GAAG,GAAG,CAAC;;;;;;;"},"dependencies":["/test/src/components/tester.svelte"]}',
          ]);
          expect(t.names).toEqual(['css/test/src/components/tester.svelte', 'f035082291f505923e6b2b9739157357']);
          expect(t.addWatchFile).toHaveBeenCalledTimes(2);
        });
      });
    });
  });
});
