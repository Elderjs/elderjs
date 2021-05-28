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
import { fork, ChildProcess } from 'child_process';
import chokidar from 'chokidar';

import partialHydration from '../partialHydration/partialHydration';
import windowsPathFix from '../utils/windowsPathFix';
import { SettingsOptions } from '../utils/types';

export type RollupCacheElder = {
  [name: string]: Set<string>;
};

let dependencyCache: RollupCacheElder = {};

const cache = new Map();

const isDev =
  (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'PRODUCTION') || !!process.env.ROLLUP_WATCH;

let srcWatcher;

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

export const getCompilerOptions = ({ type, legacy }) => {
  const compilerOptions: CompileOptions = {
    hydratable: true,
    generate: 'ssr',
    css: false,
    dev: isDev,
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

  return compilerOptions;
};

export function transformFn({
  svelteConfig,
  elderConfig,
  type,
  legacy = false,
}: {
  svelteConfig: any;
  elderConfig: SettingsOptions;
  type: 'ssr' | 'client';
  legacy: boolean;
}) {
  const compilerOptions = getCompilerOptions({ legacy, type });

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
        return cache.get(digest);
      }

      const filename = path.relative(elderConfig.rootDir, id);

      const processed = await preprocess(code, preprocessors, { filename });

      // @ts-ignore - these types aren't in the type files... but if we don't pass in a map things break.
      if (processed.map) compilerOptions.sourcemap = processed.map;

      const compiled = await compile(processed.code, { ...compilerOptions, filename });
      // (compiled.warnings || []).forEach((warning) => {
      //   if (warning.code === 'css-unused-selector') return;
      //   this.warn(warning);
      // });

      const dependencies = getDependencies(id);
      compiled.js.dependencies = [...dependencies, ...processed.dependencies];

      if (this.addWatchFile) {
        this.addWatchFile(id);
        compiled.js.dependencies.map((d) => this.addWatchFile(d));
      }
      if (type === 'ssr') {
        cache.set(`css${id}`, {
          code: compiled.css.code || '',
          map: compiled.css.map || '',
          priority: cssFilePriority(id),
        });
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
export function resolveFn(importee, importer) {
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
    rebaseTo: elderConfig.$$internal.distElder,
  });
  const sorted = sortCss(css);
  return {
    ...cleanCss.minify(sorted),
    included: sorted ? sorted.map((m) => Object.keys(m)[0]) : [],
  };
}

export const devServer = ({ elderConfig }: { elderConfig: SettingsOptions }) => {
  /**
   * Dev server bootstrapping and restarting.
   */
  let childProcess: ChildProcess;
  let bootingServer = false;

  function startOrRestartServer(count = 0) {
    if (!isDev) return;
    if (!bootingServer) {
      bootingServer = true;

      const serverJs = path.resolve(process.cwd(), elderConfig.srcDir, './server.js');

      if (!fs.existsSync(serverJs)) {
        console.error(`No server file found at ${serverJs}, unable to start dev server.`);
        return;
      }

      setTimeout(() => {
        // prevent multiple calls
        if (childProcess) childProcess.kill('SIGINT');
        bootingServer = false;
        childProcess = fork(serverJs);
        childProcess.on('exit', (code) => {
          if (code !== null) {
            console.log(`> Elder.js process exited with code ${code}`);
          }
        });
        childProcess.on('error', (err) => {
          console.error(err);
          if (count < 1) {
            startOrRestartServer(count + 1);
          }
        });
      }, 10);
    }
  }

  function handleChange(watchedPath) {
    const parsed = path.parse(watchedPath);
    if (parsed.ext !== '.svelte') {
      // prevents double reload as the compiled svelte templates are output
      startOrRestartServer();
    }
  }

  function startWatcher() {
    // notes: This is hard to reason about.
    // This should only after the initial client rollup as finished as it runs last. The srcWatcher should then live between reloads
    // until the watch process is killed.
    //
    // this should watch the ./src, elder.config.js, and the client side folders... trigging a restart of the server when something changes
    // We don't want to change when a svelte file changes because it will cause a double reload when rollup outputs the rebundled file.

    if (isDev && !srcWatcher) {
      srcWatcher = chokidar.watch(
        [
          path.resolve(process.cwd(), './src'),
          path.resolve(process.cwd(), './elder.config.js'),
          elderConfig.$$internal.distElder,
          path.join(elderConfig.$$internal.ssrComponents, 'components'),
          path.join(elderConfig.$$internal.ssrComponents, 'layouts'),
          path.join(elderConfig.$$internal.ssrComponents, 'routes'),
        ],
        {
          ignored: '*.svelte',
          usePolling: !/^(win32|darwin)$/.test(process.platform),
        },
      );

      srcWatcher.on('change', (watchedPath) => handleChange(watchedPath));
      srcWatcher.on('add', (watchedPath) => handleChange(watchedPath));
    }
  }
  return {
    startWatcher,
    childProcess,
    startOrRestartServer,
  };
};
export interface IElderjsRollupConfig {
  type: 'ssr' | 'client';
  svelteConfig: any;
  legacy?: boolean;
  elderConfig: SettingsOptions;
  startDevServer?: boolean;
}

export default function elderjsRollup({
  elderConfig,
  svelteConfig,
  type = 'ssr',
  legacy = false,
  startDevServer = false,
}: IElderjsRollupConfig): Partial<Plugin> {
  let styleCssHash;
  let styleCssMapHash;

  const { childProcess, startWatcher, startOrRestartServer } = devServer({ elderConfig });

  return {
    name: 'rollup-plugin-elder',

    watchChange(id) {
      // clean out dependency relationships on a file change.
      const prior = cache.get('dependencies');
      prior[id] = new Set();

      if (!dependencyCache) dependencyCache = {};
      dependencyCache = prior;
    },

    /**
     * Essentially what is happening here is that we need to say we're going to
     * emit these files before we know the content.
     * We are given a hash that we later use to populate them with data.
     */
    buildStart() {
      // kill server to prevent failures.
      if (childProcess) childProcess.kill('SIGINT');

      // create placeholder files to be filled later.
      if (type === 'ssr') {
        styleCssHash = this.emitFile({
          type: 'asset',
          name: 'svelte.css',
        });

        if (isDev) {
          styleCssMapHash = this.emitFile({
            type: 'asset',
            name: 'svelte.css.map',
          });
        }
      }

      // cleaning up folders that need to be deleted.
      // this shouldn't happen on legacy as it runs last and would result in deleting needed code.
      if (type === 'ssr' && legacy === false) {
        del.sync(elderConfig.$$internal.ssrComponents);
        del.sync(path.resolve(elderConfig.$$internal.distElder, `.${sep}assets${sep}`));
      } else if (type === 'client' && legacy === false) {
        del.sync(path.resolve(elderConfig.$$internal.distElder, `.${sep}svelte${sep}`));
      }
    },

    resolveId: resolveFn,
    load: loadCss,
    async transform(code, id) {
      const thisTransformFn = transformFn.bind(this);
      const r = await thisTransformFn({
        svelteConfig,
        elderConfig,
        type,
        legacy,
      })(code, id);

      if (!r) return;

      (r.warnings || []).forEach((warning) => {
        if (warning.code === 'css-unused-selector') return;
        this.warn(warning);
      });
      // eslint-disable-next-line consistent-return
      return r.output;
    },

    // eslint-disable-next-line consistent-return
    async renderChunk(code, chunk) {
      if (chunk.isEntry) {
        if (type === 'ssr') {
          const trackedDeps = getDependencies(chunk.facadeModuleId);

          const cssOutput = await minifyCss(trackedDeps, elderConfig);
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
        const { styles, sourceMap } = await minifyCss([...this.getModuleIds()], elderConfig);
        if (styleCssMapHash) {
          // set the source later when we have it.
          this.setAssetSource(styleCssMapHash, sourceMap.toString());
          const sourceMapFile = this.getFileName(styleCssMapHash);
          const sourceMapFileRel = `/${path.relative(
            elderConfig.distDir,
            path.resolve(elderConfig.$$internal.distElder, sourceMapFile),
          )}`;
          this.setAssetSource(styleCssHash, `${styles}\n /*# sourceMappingURL=${sourceMapFileRel} */`);
        } else if (styleCssHash) {
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

      cache.set('dependencies', dependencyCache);

      if (startDevServer && type === 'client') {
        startWatcher();
        startOrRestartServer();
      }
    },
  };
}
