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
  return `${mapIntro}${btoa(map.toString())} */`;
};

function cssFilePriority(pathStr) {
  if (pathStr.includes('src/components')) return 3;
  if (pathStr.includes('src/routes')) return 2;
  if (pathStr.includes('src/layouts')) return 1;
  return 0;
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

  function sortCss(css) {
    return css
      .sort((a, b) => a[1].priority - b[1].priority)
      .reduce((out, cv) => {
        out[cv[0]] = { styles: cv[1].code, sourceMap: cv[1].map };
        return out;
      }, {});
  }

  async function prepareCss(css) {
    return cleanCss.minify(sortCss(css));
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
      if (importer) {
        const parsedImporter = path.parse(importer);
        if ((parsedImporter.ext === '.svelte' && importee.includes('.svelte')) || importee.includes('.css')) {
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
    load(id) {
      const extension = path.extname(id);
      // capture imported css
      if (type === 'ssr' && extension === '.css') {
        const code = fs.readFileSync(id, 'utf-8');
        this.cache.set(`css${id}`, {
          code,
          map: '',
          priority: 5,
        });
        return '';
      }
    },
    async transform(code, id) {
      const extension = path.extname(id);

      // eslint-disable-next-line no-bitwise
      if (!~extensions.indexOf(extension)) return null;

      const dependencies = getDependencies(id);

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
        compiled.js.dependencies.forEach(this.addWatchFile);
      }

      if (type === 'ssr' && compiled.css.code) {
        this.cache.set(`css${id}`, {
          code: compiled.css.code,
          map: compiled.css.map,
          priority: cssFilePriority(id),
        });
      }

      this.cache.set(digest, compiled.js);

      return compiled.js;
    },

    renderChunk(code, chunk, options) {
      if (chunk.isEntry) {
        if (type === 'ssr') {
          const deps = getDependencies(chunk.facadeModuleId);
          const cssChunks = deps.reduce((out, cv) => {
            if (this.cache.has(`css${cv}`)) {
              const { map: sourceMap, code: styles } = this.cache.get(`css${cv}`);
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
          code += `\nmodule.exports._cssIncluded = ${JSON.stringify(deps)}`;

          return { code, map: null };
        }
      }
      return null;
    },
    // eslint-disable-next-line consistent-return
    async generateBundle() {
      // all css is only available on the ssr version...
      // but we need to move the css to the client folder.
      if (type === 'ssr') {
        const css = [];

        for (const id of this.getModuleIds()) {
          if (this.cache.has(`css${id}`)) css.push([id, this.cache.get(`css${id}`)]);
        }

        const { styles, sourceMap } = await prepareCss(css);

        if (styleCssMapHash) {
          this.setAssetSource(styleCssMapHash, sourceMap.toString());
          const sourceMapFile = this.getFileName(styleCssMapHash);
          const sourceMapFileRel = `/${path.relative(distDir, path.resolve(distElder, sourceMapFile))}`;

          this.setAssetSource(styleCssHash, `${styles}\n /*# sourceMappingURL=${sourceMapFileRel} */`);
        } else {
          this.setAssetSource(styleCssHash, styles);
        }
      } else if (type === 'client' && !legacy) {
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
