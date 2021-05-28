import { promises as fsPromises } from 'fs';
import { dirname, resolve, isAbsolute, sep, relative } from 'path';
// eslint-disable-next-line import/no-unresolved

import { Plugin, PartialMessage } from 'esbuild';

import del from 'del';
import crypto from 'crypto';
import fs from 'fs-extra';

// eslint-disable-next-line import/no-unresolved
import { PreprocessorGroup } from 'svelte/types/compiler/preprocess/types';
import { resolveFn, minifyCss, transformFn, loadCss } from '../rollup/rollupPlugin';
import { SettingsOptions } from '..';

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

/**
 * Convert a warning or error emitted from the svelte compiler for esbuild.
 */
function convertWarning(source, { message, filename, start, end }, level) {
  if (level === 'warning') {
    if (message.includes('Unused CSS selector')) return false;
  }

  if (!start || !end) {
    return { text: message };
  }
  const lines = source.split(/\r\n|\r|\n/);
  const lineText = lines[start.line - 1];
  const location = {
    file: filename,
    line: start.line,
    column: start.column,
    length: (start.line === end.line ? end.column : lineText.length) - start.column,
    lineText,
  };
  return { text: message, location };
}

export type cssCacheObj = {
  code: string;
  map: string;
  time: number;
  priority: number;
};
export type TCache = Map<
  string,
  {
    contents: string;
    css?: cssCacheObj;
    warnings: PartialMessage[];
    time: number;
    priority?: number;
    map?: string;
  }
>;

export type TPreprocess = PreprocessorGroup | PreprocessorGroup[] | false;

export interface IEsBuildPluginSvelte {
  type: 'ssr' | 'client';
  svelteConfig: any;
  legacy?: boolean;
  elderConfig: SettingsOptions;
  sveltePackages: string[];
  startDevServer?: boolean;
}

function esbuildPluginSvelte({ type, svelteConfig, elderConfig, sveltePackages = [] }: IEsBuildPluginSvelte): Plugin {
  return {
    name: 'esbuild-plugin-elderjs',

    setup(build) {
      // clean out old css files
      build.onStart(() => {
        if (type === 'ssr') {
          del.sync(elderConfig.$$internal.ssrComponents);
          del.sync(resolve(elderConfig.$$internal.distElder, `.${sep}assets${sep}`));
          del.sync(resolve(elderConfig.$$internal.distElder, `.${sep}svelte${sep}`));
        }
      });

      if (sveltePackages.length > 0) {
        const filter =
          sveltePackages.length > 1 ? new RegExp(`(${sveltePackages.join('|')})`) : new RegExp(`${sveltePackages[0]}`);
        build.onResolve({ filter }, ({ path, importer }) => {
          // below largely adapted from the rollup svelte plugin
          // ----------------------------------------------

          if (!importer || path[0] === '.' || path[0] === '\0' || isAbsolute(path)) return null;
          // if this is a bare import, see if there's a valid pkg.svelte
          const parts = path.split('/');

          let dir;
          let pkg;
          let name = parts.shift();
          if (name[0] === '@') {
            name += `/${parts.shift()}`;
          }

          try {
            const file = `.${sep}${['node_modules', name, 'package.json'].join(sep)}`;
            const resolved = resolve(process.cwd(), file);
            dir = dirname(resolved);
            // eslint-disable-next-line import/no-dynamic-require
            pkg = require(resolved);
          } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') return null;
            throw err;
          }

          // use pkg.svelte
          if (parts.length === 0 && pkg.svelte) {
            return {
              path: resolve(dir, pkg.svelte),
              pluginName: 'esbuild-plugin-elderjs',
            };
          }
          return null;
        });
      }

      build.onResolve({ filter: /\.svelte$/ }, ({ path, importer, resolveDir }) => {
        const importee = resolve(resolveDir, path);
        resolveFn(importee, importer);
        return {};
      });

      build.onResolve({ filter: /\.css$/ }, ({ path, importer, resolveDir }) => {
        const importee = resolve(resolveDir, path);
        resolveFn(importee, importer);

        return { path: importee };
      });

      build.onLoad({ filter: /\.css$/ }, async ({ path }) => {
        loadCss(path);

        return {
          contents: undefined,
        };
      });

      build.onLoad({ filter: /\.svelte$/ }, async ({ path }) => {
        const code = await fsPromises.readFile(path, 'utf-8');

        const { output, warnings } = await transformFn({
          svelteConfig,
          elderConfig,
          type,
          legacy: false,
        })(code, path);

        const out = {
          contents: output.code,
          warnings: type === 'ssr' ? warnings.map((w) => convertWarning(code, w, 'warning')).filter((w) => w) : [],
        };
        return out;
      });

      build.onEnd(async () => {
        if (type === 'ssr') {
          const s = Date.now();
          const r = await minifyCss('all', elderConfig);
          console.log(`>>>> minifying css and adding sourcemaps took ${Date.now() - s}ms`);
          const hash = md5(r.styles);

          const svelteCss = resolve(elderConfig.$$internal.distElder, `.${sep}assets${sep}svelte-${hash}.css`);

          if (process.env.NODE_ENV !== 'production' || process.env.NODE_ENV !== 'production') {
            const sourceMapFileRel = `/${relative(
              elderConfig.distDir,
              resolve(elderConfig.$$internal.distElder, `${svelteCss}.map`),
            )}`;
            r.styles = `${r.styles}\n /*# sourceMappingURL=${sourceMapFileRel} */`;
          }

          fs.outputFileSync(svelteCss, r.styles);

          fs.outputFileSync(`${svelteCss}.map`, r.sourceMap);
        }
      });
    },
  };
}
export default esbuildPluginSvelte;
