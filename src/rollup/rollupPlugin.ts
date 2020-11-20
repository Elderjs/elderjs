import path from 'path';
import CleanCSS from 'clean-css';
import { Plugin } from 'rollup';

import { compile, preprocess } from 'svelte/compiler';
import sparkMd5 from 'spark-md5';
import fs from 'fs-extra';
import devalue from 'devalue';
import btoa from 'btoa';
import partialHydration from '../partialHydration/partialHydration';

const mapIntro = `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,`;
export const encodeSourceMap = (map) => {
  return `${mapIntro}${btoa(map.toString())} */`;
};

const PREFIX = '[rollup-plugin-elder]';

function cssFilePriority(pathStr) {
  if (pathStr.includes('src/components')) return 3;
  if (pathStr.includes('src/routes')) return 2;
  if (pathStr.includes('src/layouts')) return 1;
  return 0;
}

export type RollupCacheElder = {
  svelte: Map<string, { contents: string; time: number }>;
  css: Map<string, { code: string; map: string; time: number; priority: number }>;
  dependencies: {
    [name: string]: Set<string>;
  };
};

const cache: RollupCacheElder = {
  css: new Map(),
  svelte: new Map(),
  dependencies: {},
};

const extensions = ['.svelte'];

const cleanCss = new CleanCSS({ sourceMap: true, sourceMapInlineSources: true, level: 1 });

function getDependencies(file) {
  let dependencies = new Set([file]);
  if (cache.dependencies[file]) {
    [...cache.dependencies[file].values()]
      .filter((d) => d !== file)
      .forEach((dependency) => {
        dependencies = new Set([...dependencies, ...getDependencies(dependency)]);
      });
  }
  return [...dependencies.values()];
}

export interface IElderjsRollupConfig {
  elderDir: string;
  type: 'ssr' | 'client';
  svelteConfig: any;
}

const production = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;

const clientCompilerOptions = {
  hydratable: true,
  css: false,
  dev: !production,
};

const ssrCompilerOptions = {
  hydratable: true,
  generate: 'ssr',
  css: true,
  dev: !production,
};

export default function elderjsRollup({ distDir, elderDir, svelteConfig, type = 'ssr' }): Partial<Plugin> {
  const compilerOptions = type === 'ssr' ? ssrCompilerOptions : clientCompilerOptions;

  const preprocessors =
    svelteConfig && Array.isArray(svelteConfig.preprocess)
      ? [...svelteConfig.preprocess, partialHydration]
      : [partialHydration];

  const cssPath = path.resolve(elderDir, './svelte.css');
  const cssMapPath = `${cssPath}.map`;
  const cssMapPathRel = `/${path.relative(distDir, cssMapPath)}`.replace(/\\/gm, '/'); // windows fix.

  function sortCss() {
    const r = [...cache.css.entries()]
      .sort((a, b) => a[1].priority - b[1].priority)
      .reduce((out, cv) => {
        out[cv[0]] = { styles: cv[1].code, sourceMap: cv[1].map };
        return out;
      }, {});
    return r;
  }

  async function writeCss() {
    try {
      const { styles, sourceMap } = new CleanCSS({
        level: 1,
        sourceMap: !production,
        rebaseTo: elderDir,
        sourceMapInlineSources: !production,
      }).minify(sortCss());
      await fs.outputFile(cssPath, `${styles}${!production ? `\n /*# sourceMappingURL=${cssMapPathRel} /*` : ''}`);
      if (!production) await fs.outputFile(cssMapPath, sourceMap.toString());
      console.log(`[Elder.js]: svelte.css updated `);
    } catch (e) {
      console.error(`[Elder.js]: esbuild css error`, e);
    }
  }

  return {
    name: 'rollup-plugin-elder',

    resolveId(importee, importer) {
      if (importer) {
        const parsedImporter = path.parse(importer);
        if (parsedImporter.ext === '.svelte' && importee.includes('.svelte')) {
          const fullImportee = path.resolve(parsedImporter.dir, importee);

          if (!cache.dependencies[importer]) cache.dependencies[importer] = new Set();
          cache.dependencies[importer].add(fullImportee);
        }
      }

      // const importee = PATH.resolve(resolveDir, path);
      // if (!cache.dependencies[importee])
      //   cache.dependencies[importee] = new Set();
      // cache.dependencies[importee].add(importer);

      // below largely adapted from the rollup svelte plugin
      // ----------------------------------------------

      if (!importer || importee[0] === '.' || importee[0] === '\0' || path.isAbsolute(importee)) return null;
      // if this is a bare import, see if there's a valid pkg.svelte
      const parts = importee.split('/');

      let dir;
      let pkg;
      let name = parts.shift();
      if (name[0] === '@') {
        name += `/${parts.shift()}`;
      }

      try {
        const file = `.${path.sep}${['node_modules', name, 'package.json'].join(path.sep)}`;
        const resolved = path.resolve(process.cwd(), file);
        dir = path.dirname(resolved);
        // eslint-disable-next-line import/no-dynamic-require
        pkg = require(resolved);
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') return null;
        throw err;
      }

      // use pkg.svelte
      if (parts.length === 0 && pkg.svelte) {
        return path.resolve(dir, pkg.svelte);
      }
      return null;
    },
    async transform(code, id) {
      const extension = path.extname(id);

      if (extension === '.css') {
        cache.css.set(id, {
          code,
          map: '',
          time: Date.now(),
          priority: 5,
        });

        return '';
      }

      // eslint-disable-next-line no-bitwise
      if (!~extensions.indexOf(extension)) return null;

      // look in the cache
      const digest = sparkMd5.hash(code + JSON.stringify(compilerOptions));
      if (cache.svelte.has(digest)) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { time, ...response } = cache.svelte.get(digest);
        return response;
      }

      const dependencies = [];
      const filename = path.relative(process.cwd(), id);

      const processed = await preprocess(code, preprocessors, { filename });
      const compiled = compile(processed.code, { ...compilerOptions, filename });
      (compiled.warnings || []).forEach((warning) => {
        if (warning.code === 'css-unused-selector') return;
        this.warn(warning);
      });

      if (this.addWatchFile) {
        dependencies.forEach(this.addWatchFile);
      } else {
        compiled.js.dependencies = dependencies;
      }

      compiled.js.code += `\n//# sourceMappingURL=${compiled.js.map.toUrl()}`;

      if (type === 'ssr' && compiled.css.code) {
        cache.css.set(id, {
          code: compiled.css.code,
          map: compiled.css.map,
          time: Date.now(),
          priority: cssFilePriority(id),
        });
      }

      cache.svelte.set(digest, { ...compiled.js, time: Date.now() });

      return compiled.js;
    },

    renderChunk(code, chunk) {
      if (chunk.isEntry) {
        // deduplicate during split rollup. map to correct bundle on production
        // const requiredCss = new Set(
        //   Object.keys(chunk.modules).map((c) => relDir(c).replace('.svelte', '.css').replace('.js', '.css')),
        // );

        // chunk.imports.forEach((i) => requiredCss.add(i.replace('.js', '.css')));

        // // check the cssMap to see if each of the requiredCss exists, if not, then look at importBindings

        // [...requiredCss.keys()].forEach((key) => {
        //   if (!cssMap.has(key)) {
        //     const arrayOfNamedImports = Object.keys(chunk.importedBindings)
        //       .reduce((out: string[], cv: string): string[] => {
        //         if (Array.isArray(chunk.importedBindings[cv])) {
        //           return [...out, ...chunk.importedBindings[cv]];
        //         }
        //         return out;
        //       }, [])
        //       .filter((v) => v !== 'default');
        //     const cssFileNames = [...cssMap.keys()];
        //     const importNameMatch: string | false = arrayOfNamedImports.reduce((out, namedImport) => {
        //       if (!out) {
        //         out = cssFileNames.find(
        //           (cssFile) => typeof cssFile === 'string' && cssFile.endsWith(`${namedImport}.css`),
        //         );
        //       }
        //       return out;
        //     }, false);

        //     if (importNameMatch) {
        //       requiredCss.delete(key);
        //       requiredCss.add(importNameMatch);
        //     }
        //   }
        // });

        // const { cssChunks, matches } = [...requiredCss].reduce(
        //   (out, key) => {
        //     if (cssMap.has(key)) {
        //       const [codeChunk, file] = cssMap.get(key);
        //       const [thisCss, thisMap] = splitCssSourceMap(codeChunk);

        //       // eslint-disable-next-line no-param-reassign
        //       if (thisCss.length > 0) {
        //         out.cssChunks[file] = {
        //           styles: thisCss,
        //           sourceMap: atob(thisMap),
        //         };
        //         out.matches.push(key);
        //       }
        //     }
        //     return out;
        //   },
        //   { cssChunks: {}, matches: [] },
        // );

        if (type === 'ssr') {
          const cssChunks = getDependencies(chunk.facadeModuleId).reduce((out, cv) => {
            if (cache.css.has(cv)) {
              const { map: sourceMap, code: styles } = cache.css.get(cv);
              out[cv] = {
                sourceMap,
                styles,
              };
            }

            return out;
          }, {});

          const cssOutput = cleanCss.minify(cssChunks);
          code += `\nmodule.exports._css = ${devalue(cssOutput.styles)};`;
          code += `\nmodule.exports._cssMap = ${devalue(encodeSourceMap(cssOutput.sourceMap))};`;
        }

        // code += `\nmodule.exports._cssIncluded = ${JSON.stringify(matches)}`;

        // console.log(chunk);
        return code;
      }
      return null;
    },
    buildEnd() {
      // write css
      return writeCss();
    },
  };
}
