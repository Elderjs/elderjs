import path from 'path';
import CleanCSS from 'clean-css';
import atob from 'atob';
import btoa from 'btoa';
import devalue from 'devalue';

import ssrOutputPath from './ssrOutputPath';

const cssMap = new Map();

const cleanCss = new CleanCSS({ sourceMap: true, sourceMapInlineSources: true, level: 0 });

const mapIntro = `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,`;

export const splitCssSourceMap = (code) => {
  // eslint-disable-next-line prefer-const
  let [css, map]: [String, String] = code.split(mapIntro);
  map = map.substring(0, map.length - 2); // trim "*/"
  return [css.trim(), map];
};

export const encodeSourceMap = (map) => {
  return `${mapIntro}${btoa(map.toString())} */`;
};

export default function elderjsHandleCss({ rootDir }) {
  const isCss = (id) => path.parse(id).ext === '.css';

  const relDir = (str) => {
    return ssrOutputPath(str.replace(`${rootDir}${path.sep}`, ''));
  };

  return {
    name: 'elderjs-handle-css',
    transform(code, id) {
      if (this) this.addWatchFile(id);
      if (isCss(id)) {
        cssMap.set(relDir(id), [code, id]);
        return '';
      }
      return null;
    },

    renderChunk(code, chunk) {
      if (chunk.isEntry) {
        // deduplicate during split rollup. map to correct bundle on production
        const requiredCss = new Set(
          Object.keys(chunk.modules).map((c) => relDir(c).replace('.svelte', '.css').replace('.js', '.css')),
        );

        chunk.imports.forEach((i) => requiredCss.add(i.replace('.js', '.css')));

        // check the cssMap to see if each of the requiredCss exists, if not, then look at importBindings

        [...requiredCss.keys()].forEach((key) => {
          if (!cssMap.has(key)) {
            const arrayOfNamedImports = Object.keys(chunk.importedBindings)
              .reduce((out: string[], cv: string): string[] => {
                if (Array.isArray(chunk.importedBindings[cv])) {
                  return [...out, ...chunk.importedBindings[cv]];
                }
                return out;
              }, [])
              .filter((v) => v !== 'default');
            const cssFileNames = [...cssMap.keys()];
            const importNameMatch: string | false = arrayOfNamedImports.reduce((out, namedImport) => {
              if (!out) {
                out = cssFileNames.find(
                  (cssFile) => typeof cssFile === 'string' && cssFile.endsWith(`${namedImport}.css`),
                );
              }
              return out;
            }, false);

            if (importNameMatch) {
              requiredCss.delete(key);
              requiredCss.add(importNameMatch);
            }
          }
        });

        const { cssChunks, matches } = [...requiredCss].reduce(
          (out, key) => {
            if (cssMap.has(key)) {
              const [codeChunk, file] = cssMap.get(key);
              const [thisCss, thisMap] = splitCssSourceMap(codeChunk);

              // eslint-disable-next-line no-param-reassign
              if (thisCss.length > 0) {
                out.cssChunks[file] = {
                  styles: thisCss,
                  sourceMap: atob(thisMap),
                };
                out.matches.push(key);
              }
            }
            return out;
          },
          { cssChunks: {}, matches: [] },
        );

        const cssOutput = cleanCss.minify(cssChunks);

        code += `\nmodule.exports._css = ${devalue(cssOutput.styles)};`;
        code += `\nmodule.exports._cssMap = ${devalue(encodeSourceMap(cssOutput.sourceMap))};`;
        code += `\nmodule.exports._cssIncluded = ${JSON.stringify(matches)}`;
        return code;
      }
      return null;
    },
  };
}
