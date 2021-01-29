/* eslint-disable global-require */
/* eslint-disable no-param-reassign */
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
import del from 'del';
import partialHydration from '../partialHydration/partialHydration';
import windowsPathFix from '../utils/windowsPathFix';
import { SettingsOptions } from '../utils/types';

const mapIntro = `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,`;
export const encodeSourceMap = (map) => {
  if (!map || !map.toString) return '';
  return `${mapIntro}${btoa(map.toString())} */`;
};

export const cssFilePriority = (pathStr) => {
  const normalizedPath = windowsPathFix(pathStr);
  if (normalizedPath.includes('node_modules')) return 6;
  if (normalizedPath.includes('src/layouts')) return 3;
  if (normalizedPath.includes('src/routes')) return 2;
  if (normalizedPath.includes('src/components')) return 1;

  return 0;
};

export function logDependency(importee, importer, memoryCache) {
  if (importee === 'svelte/internal' || importee === 'svelte') return;
  if (importer) {
    const parsedImporter = path.parse(importer);

    // The following two expressions are used to determine if we are trying to import
    // a svelte file from an external dependency and ensure that we add the correct path to that dependency
    const externalDependencyImport = path.resolve(
      parsedImporter.dir.substr(0, parsedImporter.dir.lastIndexOf('src')),
      'node_modules',
      importee,
    );
    const isExternalDependency = fs.pathExistsSync(externalDependencyImport);
    if (!memoryCache.dependencies[importer]) memoryCache.dependencies[importer] = new Set();
    if (importee.includes('node_modules')) {
      memoryCache.dependencies[importer].add(importee);
    } else if (importer.includes('node_modules')) {
      const fullImportee = path.resolve(parsedImporter.dir, importee);
      memoryCache.dependencies[importer].add(fullImportee);
    } else if (importee.includes('.svelte') && isExternalDependency) {
      memoryCache.dependencies[importer].add(externalDependencyImport);
    } else if ((parsedImporter.ext === '.svelte' && importee.includes('.svelte')) || importee.includes('.css')) {
      const fullImportee = path.resolve(parsedImporter.dir, importee);
      memoryCache.dependencies[importer].add(fullImportee);
    } else {
      memoryCache.dependencies[importer].add(importee);
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
    .sort((a, b) => b[1].priority - a[1].priority)
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
    const code = fs.readFileSync(id, 'utf-8');
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

let cache: RollupCacheElder = {
  dependencies: {},
};

const production = process.env.NODE_ENV === 'production' || !process.env.ROLLUP_WATCH;

export interface IElderjsRollupConfig {
  type: 'ssr' | 'client';
  svelteConfig: any;
  legacy?: boolean;
  elderConfig: SettingsOptions;
}

export default function elderjsRollup({
  elderConfig,
  svelteConfig,
  type = 'ssr',
  legacy = false,
}: IElderjsRollupConfig): Partial<Plugin> {
  const cleanCss = new CleanCSS({
    sourceMap: !production,
    sourceMapInlineSources: !production,
    level: 1,
    rebaseTo: elderConfig.$$internal.distElder,
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

  const extensions = (svelteConfig && svelteConfig.extensions) || ['.svelte'];

  const preprocessors =
    svelteConfig && Array.isArray(svelteConfig.preprocess)
      ? [...svelteConfig.preprocess, partialHydration]
      : [partialHydration];

  async function prepareCss(css = []) {
    const sorted = sortCss(css);
    return {
      ...cleanCss.minify(sorted),
      included: sorted ? sorted.map((m) => Object.keys(m)[0]) : [],
    };
  }

  let styleCssHash;
  let styleCssMapHash;

  return {
    name: 'rollup-plugin-elder',

    watchChange(id) {
      const prior = this.cache.get('dependencies');
      prior[id] = new Set();

      if (!cache) cache = { dependencies: {} };
      cache.dependencies = prior;
    },

    /**
     * Essentially what is happening here is that we need to say we're going to
     * emit these files before we know the content.
     * We are given a hash that we later use to populate them with data.
     */
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

      if (type === 'ssr' && legacy === false) {
        del.sync(elderConfig.$$internal.ssrComponents);
        del.sync(path.resolve(elderConfig.$$internal.distElder, `.${sep}assets${sep}`));
      } else if (type === 'client' && legacy === false) {
        del.sync(path.resolve(elderConfig.$$internal.distElder, `.${sep}svelte${sep}`));
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
        if (err.code === 'MODULE_NOT_FOUND') {
          if (err.message && name !== 'svelte') console.log(err);
          return null;
        }
        throw err;
      }

      // use pkg.svelte
      if (parts.length === 0 && pkg.svelte) {
        const svelteResolve = path.resolve(dir, pkg.svelte);
        // console.log('-----------------', svelteResolve, name);
        logDependency(svelteResolve, name, cache);
        return svelteResolve;
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

      const filename = path.relative(elderConfig.rootDir, id);

      const processed = await preprocess(code, preprocessors, { filename });

      // @ts-ignore - these types aren't in the type files... but if we don't pass in a map things break.
      if (processed.map) compilerOptions.sourcemap = processed.map;

      const compiled = await compile(processed.code, { ...compilerOptions, filename });
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

    // eslint-disable-next-line consistent-return
    async renderChunk(code, chunk) {
      if (chunk.isEntry) {
        if (type === 'ssr') {
          const trackedDeps = getDependencies(chunk.facadeModuleId, cache);

          const cssEntries = getCssFromCache(trackedDeps, this.cache);
          const cssOutput = await prepareCss(cssEntries);
          code += `\nmodule.exports._css = ${devalue(cssOutput.styles)};`;
          code += `\nmodule.exports._cssMap = ${devalue(encodeSourceMap(cssOutput.sourceMap))};`;
          code += `\nmodule.exports._cssIncluded = ${JSON.stringify(
            cssOutput.included.map((d) => path.relative(elderConfig.rootDir, d)),
          )}`;

          return { code, map: null };
        }
      }
    },

    /**
     * generateBundle is used to write all of the CSS to the file system
     * @param options
     * @param bundle
     * @param isWrite
     */

    // eslint-disable-next-line consistent-return
    async generateBundle() {
      // IMPORTANT!!!
      // all css is only available on the ssr version...
      // but we need to move the css to the client folder.
      if (type === 'ssr') {
        const cssEntries = getCssFromCache([...this.getModuleIds()], this.cache);

        const { styles, sourceMap } = await prepareCss(cssEntries);
        if (styleCssMapHash) {
          // set the source later when we have it.
          this.setAssetSource(styleCssMapHash, sourceMap.toString());
          const sourceMapFile = this.getFileName(styleCssMapHash);
          const sourceMapFileRel = `/${path.relative(
            elderConfig.distDir,
            path.resolve(elderConfig.$$internal.distElder, sourceMapFile),
          )}`;
          this.setAssetSource(styleCssHash, `${styles}\n /*# sourceMappingURL=${sourceMapFileRel} */`);
        } else {
          this.setAssetSource(styleCssHash, styles);
        }
      }
    },

    writeBundle() {
      if (type === 'ssr') {
        // copy over assets from the ssr folder to the client folder
        const ssrAssets = path.resolve(elderConfig.rootDir, `.${sep}___ELDER___${sep}compiled${sep}assets`);
        const clientAssets = path.resolve(elderConfig.$$internal.distElder, `.${sep}assets${sep}`);
        fs.ensureDirSync(clientAssets);
        const open = fs.readdirSync(ssrAssets);
        if (open.length > 0) {
          open.forEach((name) => {
            fs.copyFileSync(path.join(ssrAssets, name), path.join(clientAssets, name));
          });
        }
      }

      this.cache.set('dependencies', cache.dependencies);
    },
  };
}
