import devalue from 'devalue';
import path from 'path';

import ssrOutputPath from './ssrOutputPath';

const cssMap = new Map();

export const splitCssSourceMap = (code) => {
  const mapIntro = `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,`;
  // eslint-disable-next-line prefer-const
  let [css, map] = code.split(mapIntro);

  map = `${mapIntro}${map}`;
  return [css.trim(), map];
};

export default function elderjsHandleCss({ rootDir }) {
  const isCss = (id) => path.parse(id).ext === '.css';

  const relDir = (str) => {
    return ssrOutputPath(str.replace(`${rootDir}/`, ''));
  };

  return {
    name: 'elderjs-handle-css',
    transform(code, id) {
      if (isCss(id)) {
        cssMap.set(relDir(id), code);
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

        const { css, map, matches } = [...requiredCss].reduce(
          (out, key) => {
            if (cssMap.has(key)) {
              const [thisCss, thisMap] = splitCssSourceMap(cssMap.get(key));
              out.css.push(thisCss);
              out.map.push(thisMap);
              out.matches.push(key);
            }
            return out;
          },
          { css: [], map: [], matches: [] },
        );

        code += `\nmodule.exports._css = ${devalue(css)};`;
        code += `\nmodule.exports._cssMap = ${devalue(map)};`;
        code += `\nmodule.exports._cssIncluded = ${JSON.stringify(matches)}`;
        return code;
      }
      return null;
    },
  };
}
