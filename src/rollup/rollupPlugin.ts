import path, { sep } from 'path';
import CleanCSS from 'clean-css';
import { Plugin } from 'rollup';

import { compile, preprocess } from 'svelte/compiler';
import sparkMd5 from 'spark-md5';
import fs from 'fs-extra';
import devalue from 'devalue';
import btoa from 'btoa';
// eslint-disable-next-line import/no-unresolved
import { CompileOptions } from 'svelte/types/compiler/interfaces';
import partialHydration from '../partialHydration/partialHydration';

const mapIntro = `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,`;
export const encodeSourceMap = (map) => {
  if (!map || !map.toString) return '';
  return `${mapIntro}${btoa(map.toString())} */`;
};

export const cssFilePriority = (pathStr) => {
  if (pathStr.includes('src/components')) return 1;
  if (pathStr.includes('src/routes')) return 2;
  if (pathStr.includes('src/layouts')) return 3;
  return 0;
};

export function logDependency(importee, importer, memoryCache) {
  if (importer) {
    const parsedImporter = path.parse(importer);
    if ((parsedImporter.ext === '.svelte' && importee.includes('.svelte')) || importee.includes('.css')) {
      const fullImportee = path.resolve(parsedImporter.dir, importee);
      if (!memoryCache.dependencies[importer]) memoryCache.dependencies[importer] = new Set();
      memoryCache.dependencies[importer].add(fullImportee);
    }
  }
}

export const getDependencies = (file, memoryCache) => {
  let dependencies = new Set([file]);
  if (memoryCache.dependencies[file]) {
    [...memoryCache.dependencies[file].values()]
      .filter((d) => d !== file)
      .forEach((dependency) => {
        dependencies = new Set([...dependencies, ...getDependencies(dependency, memoryCache)]);
      });
  }
  return [...dependencies.values()];
};

export const sortCss = (css) => {
  return css
    .sort((a, b) => a[1].priority - b[1].priority)
    .reduce((out, cv) => {
      const o = {};
      o[cv[0]] = { styles: cv[1].code, sourceMap: cv[1].map };
      out.push(o);
      return out;
    }, []);
};

export const getCssFromCache = (arr, rollupCache) => {
  const css = [];
  for (const id of arr) {
    if (rollupCache.has(`css${id}`)) css.push([id, rollupCache.get(`css${id}`)]);
  }
  return css;
};

// eslint-disable-next-line consistent-return
export function load(id) {
  const extension = path.extname(id);
  // capture imported css
  if (extension === '.css') {
    let code;
    if (fs.existsSync(id)) {
      code = fs.readFileSync(id, 'utf-8');
    } else {
      code = '';
    }

    this.cache.set(`css${id}`, {
      code,
      map: '',
      priority: 5,
    });
    return '';
  }
}

export type RollupCacheElder = {
  dependencies: {
    [name: string]: Set<string>;
  };
};

const cache: RollupCacheElder = {
  dependencies: {},
};

const extensions = ['.svelte'];

const production = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;

export interface IElderjsRollupConfig {
  distElder: string;
  type: 'ssr' | 'client';
  svelteConfig: any;
  legacy?: boolean;
  rootDir: string;
  distDir: string;
}

export default function elderjsRollup({
  distDir,
  distElder,
  svelteConfig,
  type = 'ssr',
  legacy = false,
  rootDir,
}: IElderjsRollupConfig): Partial<Plugin> {
  const cleanCss = new CleanCSS({
    sourceMap: !production,
    sourceMapInlineSources: !production,
    level: 1,
    rebaseTo: distElder,
  });

  const compilerOptions: CompileOptions = {
    hydratable: true,
    generate: 'ssr',
    css: false,
    dev: !production,
    legacy: false,
    format: 'esm',
  };

  if (type === 'client') {
    compilerOptions.generate = 'dom';
    compilerOptions.format = 'esm';
  }

  if (legacy) {
    compilerOptions.legacy = true;
  }

  const preprocessors =
    svelteConfig && Array.isArray(svelteConfig.preprocess)
      ? [...svelteConfig.preprocess, partialHydration]
      : [partialHydration];

  async function prepareCss(css = []) {
    const sorted = sortCss(css);
    return {
      ...cleanCss.minify(sorted),
      included: sorted.map((m) => Object.keys(m)[0]),
    };
  }

  let styleCssHash;
  let styleCssMapHash;

  return {
    name: 'rollup-plugin-elder',

    buildStart() {
      if (type === 'ssr') {
        styleCssHash = this.emitFile({
          type: 'asset',
          name: 'svelte.css',
        });

        if (!production) {
          styleCssMapHash = this.emitFile({
            type: 'asset',
            name: 'svelte.css.map',
          });
        }
      }
    },

    resolveId(importee, importer) {
      // build list of dependencies so we know what CSS to inject into the export.
      logDependency(importee, importer, cache);

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
    load,
    async transform(code, id) {
      const extension = path.extname(id);

      // eslint-disable-next-line no-bitwise
      if (!~extensions.indexOf(extension)) return null;

      const dependencies = getDependencies(id, cache);

      if (this.addWatchFile) {
        this.addWatchFile(id);
      }

      // look in the cache

      const digest = sparkMd5.hash(code + JSON.stringify(compilerOptions));
      if (this.cache.has(digest)) {
        return this.cache.get(digest);
      }

      const filename = path.relative(rootDir, id);

      const processed = await preprocess(code, preprocessors, { filename });

      const compiled = compile(processed.code, { ...compilerOptions, filename });
      (compiled.warnings || []).forEach((warning) => {
        if (warning.code === 'css-unused-selector') return;
        this.warn(warning);
      });

      compiled.js.dependencies = [...dependencies, ...processed.dependencies];

      if (this.addWatchFile) {
        compiled.js.dependencies.map(this.addWatchFile);
      }

      if (type === 'ssr') {
        this.cache.set(`css${id}`, {
          code: compiled.css.code || '',
          map: compiled.css.map || '',
          priority: cssFilePriority(id),
        });
      }

      this.cache.set(digest, compiled.js);

      return compiled.js;
    },

    async renderChunk(code, chunk, options) {
      if (chunk.isEntry) {
        if (type === 'ssr') {
          const cssEntries = getCssFromCache(getDependencies(chunk.facadeModuleId, cache), this.cache);
          const cssOutput = await prepareCss(cssEntries);
          code += `\nmodule.exports._css = ${devalue(cssOutput.styles)};`;
          code += `\nmodule.exports._cssMap = ${devalue(encodeSourceMap(cssOutput.sourceMap))};`;
          code += `\nmodule.exports._cssIncluded = ${JSON.stringify(
            cssOutput.included.map((d) => path.relative(rootDir, d)),
          )}`;

          return { code, map: null };
        }
      }
      return null;
    },
    // eslint-disable-next-line consistent-return
    async generateBundle() {
      // IMPORTANT!!!
      // all css is only available on the ssr version...
      // but we need to move the css to the client folder.
      if (type === 'ssr') {
        const cssEntries = getCssFromCache([...this.getModuleIds()], this.cache);

        const { styles, sourceMap } = await prepareCss(cssEntries);

        if (styleCssMapHash) {
          this.setAssetSource(styleCssMapHash, sourceMap.toString());
          const sourceMapFile = this.getFileName(styleCssMapHash);
          const sourceMapFileRel = `/${path.relative(distDir, path.resolve(distElder, sourceMapFile))}`;
          this.setAssetSource(styleCssHash, `${styles}\n /*# sourceMappingURL=${sourceMapFileRel} */`);
        } else {
          this.setAssetSource(styleCssHash, styles);
        }
      } else if (type === 'client' && !legacy) {
        // copy over assets from the ssr folder to the client folder
        const ssrAssets = path.resolve(rootDir, `.${sep}___ELDER___${sep}compiled${sep}assets`);
        const clientAssets = path.resolve(distElder, `.${sep}assets${sep}`);
        fs.ensureDirSync(clientAssets);
        const open = fs.readdirSync(ssrAssets);
        if (open.length > 0) {
          open.forEach((name) => {
            fs.copyFileSync(path.join(ssrAssets, name), path.join(clientAssets, name));
          });
        }
      }
    },
  };
}
