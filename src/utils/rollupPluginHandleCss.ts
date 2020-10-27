import devalue from 'devalue';
import ssrOutputPath from './ssrOutputPath';

const cssMap = new Map();

export default function elderjsHandleCss({ distDir, production, srcDir, rootDir }) {
  const isCss = (id) => id.endsWith('.css');

  const mapIntro = `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,`;

  const splitCssSourceMap = (code) => {
    // eslint-disable-next-line prefer-const
    let [css, map] = code.split(mapIntro);

    map = `${mapIntro}${map}`;
    return [css, map];
  };

  const relDir = (str) => {
    return ssrOutputPath(str.replace(`${rootDir}/`, ''));
  };

  return {
    name: 'elderjs-handle-css',

    //     /* Type: (options: InputOptions) => InputOptions | null */
    //     /* Kind: sync, sequential                               */
    //     options(options) {},

    //     /* Type: (options: InputOptions) => void */
    //     /* Kind: async, parallel                 */
    //     buildStart(options) {},

    //     /* Type: (source: string, importer: string) =>
    //          string |
    //          false |
    //          null |
    //          {id: string, external?: boolean, moduleSideEffects?: boolean | null} */
    //     /* Kind: async, first */
    //     resolveId(source, importer) {},

    //     /* Type: (specifier: string | ESTree.Node, importer: string) =>
    //          string |
    //          false |
    //          null |
    //          {id: string, external?: boolean} */
    //     /* Kind: async, first */
    //     resolveDynamicImport(specifier, importer) {},

    /* Type: (id: string) =>
         string |
         null |
         { code: string, map?: string | SourceMap, ast?: ESTree.Program, moduleSideEffects?: boolean | null } */
    /* Kind: async, first */
    //     load(id) {
    //       if (!isSvelte(id)) return null;
    //       const parsed = path.parse(id);
    //       loaded[`${parsed.dir}${parsed.name}`] = {
    //         css: '',
    //       };
    //       return null;
    //     },

    /* Type: (code: string, id: string) =>
         string |
         null |
         { code: string, map?: string | SourceMap, ast?: ESTree.Program, moduleSideEffects?: boolean | null } */
    /* Kind: async, sequential */
    transform(code, id) {
      if (isCss(id)) {
        const compressed = code;

        cssMap.set(relDir(id), compressed);
        return '';
      }
      return null;
    },

    //     /* Type: (error?: Error) => void */
    //     /* Kind: async, parallel         */
    //     buildEnd(error) {},

    //     /* Type: (id: string) => void */
    //     /* Kind: sync, sequential     */
    //     watchChange(id) {
    //       console.log(id);
    //     },

    //     /* Type: (outputOptions: OutputOptions) => OutputOptions | null */
    //     /* Kind: sync, sequential                                       */
    //     outputOptions(options) {},

    //     /* Type: () => void      */
    //     /* Kind: async, parallel */
    //     renderStart() {},

    //     /* Type: (
    //          property: string | null,
    //          {chunkId: string, moduleId: string, format: string}
    //        ) => string | null */
    //     /* Kind: sync, first  */
    //     resolveImportMeta(property, { chunkId, moduleId, format }) {},

    //     /* Type: ({
    //          assetReferenceId: string | null,
    //          chunkId: string,
    //          chunkReferenceId: string | null,
    //          fileName: string,
    //          format: string,
    //          moduleId: string,
    //          relativePath: string
    //        }) => string | null */
    //     /* Kind: sync, first   */
    //     resolveFileUrl(file) {},

    /* Type: (code: string, chunk: ChunkInfo, options: OutputOptions) =>
         string |
         { code: string, map: SourceMap } |
         null                  */
    /* Kind: async, sequential */
    renderChunk(code, chunk, options) {
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
        code += `\nmodule.exports._includedCss = ${JSON.stringify(matches)}`;
        return code;
      }
      return null;
    },

    //     /* Type: (error: Error) => void */
    //     /* Kind: async, parallel        */
    //     renderError(error) {},

    //     /* Type: string | (() => string)  */
    //     /* Kind: async, parallel          */
    //     banner: '',

    //     /* Type: string | (() => string)  */
    //     /* Kind: async, parallel          */
    //     footer: '',

    //     /* Type: string | (() => string)  */
    //     /* Kind: async, parallel          */
    //     intro: '',

    //     /* Type: string | (() => string)  */
    //     /* Kind: async, parallel          */
    //     outro: '',
  };
}
