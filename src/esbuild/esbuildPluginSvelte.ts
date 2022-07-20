import { promises as fsPromises } from 'fs';
import { dirname, resolve, isAbsolute, sep, relative } from 'path';

import { Plugin, PartialMessage } from 'esbuild';

import del from 'del';
import crypto from 'crypto';
import fs from 'fs-extra';

import { PreprocessorGroup } from 'svelte/types/compiler/preprocess/types';
import { resolveFn, minifyCss, transformFn, loadCss } from './bundleTools.js';
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

export type CssCacheObj = {
  code: string;
  map: string;
  time: number;
  priority: number;
};
export type TCache = Map<
  string,
  {
    contents: string;
    css?: CssCacheObj;
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
  elderConfig: SettingsOptions;
  sveltePackages: string[];
  startDevServer?: boolean;
}

export async function writeCss({ styles, sourceMap, outputLocation, elderConfig }) {
  if (!elderConfig.$$internal.production) {
    const sourceMapFileRel = `/${relative(
      elderConfig.distDir,
      resolve(elderConfig.$$internal.distElder, `${outputLocation}.map`),
    )}`;
    styles = `${styles}\n /*# sourceMappingURL=${sourceMapFileRel} */`;
  }

  await fs.outputFile(outputLocation, styles);

  if (sourceMap && !elderConfig.$$internal.production) {
    await fs.outputFile(`${outputLocation}.map`, sourceMap.toString());
  }
}

function esbuildPluginSvelte({ type, svelteConfig, elderConfig, sveltePackages = [] }: IEsBuildPluginSvelte): Plugin {
  return {
    name: 'esbuild-plugin-elderjs',

    setup(build) {
      try {
        // clean out old files
        build.onStart(() => {
          if (type === 'ssr') {
            del.sync(elderConfig.$$internal.ssrComponents);
            del.sync(resolve(elderConfig.$$internal.distElder, `.${sep}assets${sep}`));
            del.sync(resolve(elderConfig.$$internal.distElder, `.${sep}props${sep}`));
          } else if (type === 'client') {
            del.sync(resolve(elderConfig.$$internal.distElder, `.${sep}svelte${sep}`));
          }
        });

        if (sveltePackages.length > 0) {
          const filter =
            sveltePackages.length > 1
              ? new RegExp(`(${sveltePackages.join('|')})`)
              : new RegExp(`${sveltePackages[0]}`);
          build.onResolve({ filter }, async ({ path, importer }) => {
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

              pkg = await import(resolved);
            } catch (err) {
              if (err.code === 'MODULE_NOT_FOUND') return null;
              throw err;
            }

            console.log('esbuildPluginSvelte pkgs', pkg);
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

        build.onResolve({ filter: /\.svelte$/ }, async ({ path, importer, resolveDir }) => {
          const importee = resolve(resolveDir, path);
          await resolveFn(importee, importer);
          return {};
        });

        build.onResolve({ filter: /\.css$/ }, async ({ path, importer, resolveDir }) => {
          const importee = resolve(resolveDir, path);
          await resolveFn(importee, importer);

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
          })(code, path);

          const out = {
            contents: output.code,
            warnings: type === 'ssr' ? warnings.map((w) => convertWarning(code, w, 'warning')).filter((w) => w) : [],
          };
          return out;
        });

        build.onEnd(async () => {
          if (type === 'ssr') {
            let { sourceMap, styles } = await minifyCss('all', elderConfig);

            const hash = md5(styles);

            const outputLocation = resolve(elderConfig.$$internal.distElder, `.${sep}assets${sep}svelte-${hash}.css`);

            await writeCss({
              styles,
              outputLocation,
              sourceMap,
              elderConfig,
            });
          }
        });
      } catch (e) {
        console.error(e);
      }
    },
  };
}
export default esbuildPluginSvelte;
