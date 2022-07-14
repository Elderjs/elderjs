import path from 'path';
import CleanCSS from 'clean-css';
import { compile, preprocess } from 'svelte/compiler';
import sparkMd5 from 'spark-md5';
import fs from 'fs-extra';
import btoa from 'btoa';

import { CompileOptions } from 'svelte/types/compiler/interfaces';

import partialHydration from '../partialHydration/partialHydration.js';
import windowsPathFix from '../utils/windowsPathFix.js';
import { SettingsOptions } from '../utils/types.js';

export type RollupCacheElder = {
  [name: string]: Set<string>;
};

let dependencyCache: RollupCacheElder = {};

const cache = new Map();

const isDev =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'PRODUCTION' && !!process.env.ROLLUP_WATCH;

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

export const getDependencies = (file) => {
  let dependencies = new Set([file]);
  if (dependencyCache[file]) {
    [...dependencyCache[file].values()]
      .filter((d) => d !== file)
      .forEach((dependency) => {
        dependencies = new Set([...dependencies, ...getDependencies(dependency)]);
      });
  }
  return [...dependencies.values()];
};

export const getCompilerOptions = ({ type }) => {
  const compilerOptions: CompileOptions = {
    hydratable: true,
    generate: 'ssr',
    css: false,
    dev: isDev,
    format: 'esm',
  };

  if (type === 'client') {
    compilerOptions.generate = 'dom';
    compilerOptions.format = 'esm';
  }

  return compilerOptions;
};

export function transformFn({
  svelteConfig,
  elderConfig,
  type,
}: {
  svelteConfig: any;
  elderConfig: SettingsOptions;
  type: 'ssr' | 'client';
}) {
  const compilerOptions = getCompilerOptions({ type });

  const preprocessors =
    svelteConfig && Array.isArray(svelteConfig.preprocess)
      ? [...svelteConfig.preprocess, partialHydration]
      : [partialHydration];

  return async (code, id) => {
    const extensions = (svelteConfig && svelteConfig.extensions) || ['.svelte'];

    try {
      const extension = path.extname(id);

      // eslint-disable-next-line no-bitwise
      if (!~extensions.indexOf(extension)) return null;

      // look in the cache

      const digest = sparkMd5.hash(code + JSON.stringify(compilerOptions));

      if (cache.has(digest)) {
        if (type === 'ssr') {
          // we should return the cache... but we also must update the css cache for this file or it will be stale.
          const css = cache.get(`css${digest}`);
          if (css) {
            cache.set(`css${id}`, css);
          }
        }
        return cache.get(digest);
      }

      const filename = path.relative(elderConfig.rootDir, id);

      const processed = await preprocess(code, preprocessors, { filename });

      if (processed.map) compilerOptions.sourcemap = processed.map;

      const compiled = await compile(processed.code, { ...compilerOptions, filename });
      // (compiled.warnings || []).forEach((warning) => {
      //   if (warning.code === 'css-unused-selector') return;
      //   this.warn(warning);
      // });

      const dependencies = getDependencies(id);
      compiled.js.dependencies = [...dependencies, ...processed.dependencies];

      if (this && this.addWatchFile) {
        this.addWatchFile(id);
        compiled.js.dependencies.map((d) => this.addWatchFile(d));
      }
      if (type === 'ssr') {
        const css = {
          code: compiled.css.code || '',
          map: compiled.css.map || '',
          priority: cssFilePriority(id),
        };

        cache.set(`css${id}`, css);

        // create CSS digest so we can grab it again in the future when we see this same digest.
        cache.set(`css${digest}`, css);
      }

      cache.set(digest, { output: compiled.js, warnings: compiled.warnings || [] });

      return { output: compiled.js, warnings: compiled.warnings || [] };
    } catch (e) {
      console.error('> Elder.js error in transform.', e);
      throw e;
    }
  };
}

export function logDependency(importee, importer) {
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
    if (!dependencyCache[importer]) dependencyCache[importer] = new Set();
    if (importee.includes('node_modules')) {
      dependencyCache[importer].add(importee);
    } else if (importer.includes('node_modules')) {
      const fullImportee = path.resolve(parsedImporter.dir, importee);
      dependencyCache[importer].add(fullImportee);
    } else if (importee.includes('.svelte') && isExternalDependency) {
      dependencyCache[importer].add(externalDependencyImport);
    } else if ((parsedImporter.ext === '.svelte' && importee.includes('.svelte')) || importee.includes('.css')) {
      const fullImportee = path.resolve(parsedImporter.dir, importee);
      dependencyCache[importer].add(fullImportee);
    } else {
      dependencyCache[importer].add(importee);
    }
  }
  // eslint-disable-next-line consistent-return
  return dependencyCache;
}

export function getDependencyCache() {
  return dependencyCache;
}

export function resetDependencyCache() {
  dependencyCache = {};
}

// allows for injection of the cache and future sharing with esbuild
export async function resolveFn(importee, importer) {
  // build list of dependencies so we know what CSS to inject into the export.

  logDependency(importee, importer);
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

    pkg = await import(resolved);
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
    logDependency(svelteResolve, name);
    return svelteResolve;
  }
  return null;
}

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

// eslint-disable-next-line consistent-return
export function loadCss(id) {
  const extension = path.extname(id);
  // capture imported css
  if (extension === '.css') {
    const code = fs.readFileSync(id, 'utf-8');
    cache.set(`css${id}`, {
      code,
      map: '',
      priority: 5,
    });
    return '';
  }
}

export const getCssFromCache = (arr: string[] | 'all'): [string, string][] => {
  const css = [];
  if (arr === 'all') {
    for (const [key, value] of cache.entries()) {
      if (key.indexOf('css') === 0) {
        const id = key.substr(3);
        css.push([id, value]);
      }
    }
  } else {
    for (const id of arr) {
      if (cache.has(`css${id}`)) css.push([id, cache.get(`css${id}`)]);
    }
  }

  return css;
};

export async function minifyCss(dependencies: string[] | 'all' = [], elderConfig: SettingsOptions) {
  const css = getCssFromCache(dependencies);

  const cleanCss = new CleanCSS({
    sourceMap: true,
    sourceMapInlineSources: true,
    level: isDev ? 0 : 1,
    rebaseTo: elderConfig.distDir,
    // rebase: elderConfig.distDir,
  });
  const sorted = sortCss(css);
  return {
    ...cleanCss.minify(sorted),
    included: sorted ? sorted.map((m) => Object.keys(m)[0]) : [],
  };
}
