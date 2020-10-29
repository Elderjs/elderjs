import rollupPluginHandleCss, { splitCssSourceMap } from '../rollupPluginHandleCss';

const cssCode1 = `.banner.svelte-ga2h7w{padding:1rem 2rem;background:#eee;border-radius:2rem;margin-bottom:1rem}.entries.svelte-ga2h7w{display:grid;grid-template-columns:1fr;margin:3rem 0}@media(min-width: 768px){.entries.svelte-ga2h7w{display:grid;grid-template-columns:1fr 1fr 1fr;margin:3rem 0}.entries .entry{margin-right:1rem}}.entry{padding:1rem;border:1px solid #ddd;border-radius:1rem;margin-bottom:1rem;background:white}.about.svelte-ga2h7w{margin-bottom:2rem}@media(min-width: 768px){.hydrate.svelte-ga2h7w{display:grid;grid-template-columns:80% 20%}}.hooks.svelte-ga2h7w{display:grid;grid-template-columns:100%}@media(min-width: 768px){.hooks.svelte-ga2h7w{grid-template-columns:50% 50%}}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9tZS5zdmVsdGUiLCJzb3VyY2VzIjpbIkhvbWUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ`;

const cssCode2 = `.list.svelte-1y4dd2k.svelte-1y4dd2k{display:block;margin-bottom:0.5rem;font-size:13px}.list.svelte-1y4dd2k .code.svelte-1y4dd2k{cursor:help}.hook.svelte-1y4dd2k.svelte-1y4dd2k{max-width:100%;text-overflow:wrap;padding:1rem;border:1px solid #ddd;border-collapse:collapse;margin-bottom:1rem;border-radius:1rem;position:relative;background:white}.hook-number.svelte-1y4dd2k.svelte-1y4dd2k{position:absolute;top:0;right:0px;width:2rem;height:1.75rem;border-top-right-radius:1rem;border-bottom-left-radius:1rem;text-align:center;padding-top:3px;background:#ddd;font-size:14px}.overview.svelte-1y4dd2k.svelte-1y4dd2k{margin-right:1rem}@media(min-width: 768px){.hook.svelte-1y4dd2k.svelte-1y4dd2k:nth-child(even){margin-left:0.5rem}.hook.svelte-1y4dd2k.svelte-1y4dd2k:nth-child(odd){margin-right:0.5rem}}.use.svelte-1y4dd2k.svelte-1y4dd2k{font-size:14px}.use ul{padding-left:1rem}.overview.svelte-1y4dd2k.svelte-1y4dd2k{margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid #ddd}
/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9va0RldGFpbC5zdmVsdGUiLCJzb3VyY2VzIjpbIkhvb2tEZXRhaWwuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGV4cG9ydCBsZXQgaG9vaztcbiAgZXhwb3J0IGxldCBpO1xuICBleHBvcnQgbGV0IGhvb2tFbnRpdHlEZWZpbm`;

const sourceMapPrefix = '/*# sourceMappingURL=data:application/json;charset=utf-8;base64,';

const simpleSvelte = {
  exports: ['default'],
  facadeModuleId: '/Users/nick/repos/elderjs/template/src/routes/simple/Simple.svelte',
  isDynamicEntry: false,
  isEntry: true,
  isImplicitEntry: false,
  modules: {
    '/Users/nick/repos/elderjs/template/src/routes/simple/Simple.css': {
      originalLength: 1404,
      removedExports: [],
      renderedExports: [],
      renderedLength: 0,
    },
    '/Users/nick/repos/elderjs/template/src/routes/simple/Simple.svelte': {
      originalLength: 337,
      removedExports: [],
      renderedExports: [],
      renderedLength: 1829,
    },
  },
  type: 'chunk',
  code: undefined,
  dynamicImports: [],
  fileName: 'routes/Simple.js',
  implicitlyLoadedBefore: [],
  importedBindings: { 'index-f52204f9.js': ['create_ssr_component', 'escape', 'each'] },
  imports: ['index-f52204f9.js'],
  map: undefined,
  referencedFiles: [],
};

const homeSvelte = {
  exports: ['default'],
  facadeModuleId: '/Users/nick/repos/elderjs/template/src/routes/home/Home.svelte',
  isDynamicEntry: false,
  isEntry: true,
  isImplicitEntry: false,
  modules: {
    '/Users/nick/repos/elderjs/template/src/routes/home/Home.css': {
      originalLength: 12941,
      removedExports: [],
      renderedExports: [],
      renderedLength: 0,
    },
    '/Users/nick/repos/elderjs/template/src/routes/home/Home.svelte': {
      originalLength: 5694,
      removedExports: [],
      renderedExports: [],
      renderedLength: 15667,
    },
  },
  name: [],
  type: 'chunk',
  code: undefined,
  dynamicImports: [],
  fileName: 'routes/Home.js',
  implicitlyLoadedBefore: [],
  importedBindings: {
    'index-f52204f9.js': ['create_ssr_component', 'escape', 'each', 'validate_component', 'add_attribute'],
    'components/HookDetail.js': ['default'],
    'components/BlogTeaser.js': ['default'],
    'components/Clock.js': [],
  },
  imports: ['index-f52204f9.js', 'components/HookDetail.js', 'components/BlogTeaser.js', 'components/Clock.js'],
  map: undefined,
  referencedFiles: [],
};

beforeEach(() => {
  jest.resetModules();
});

describe('#rollupPluginHandleCss', () => {
  describe('#name', () => {
    const { name } = rollupPluginHandleCss({ rootDir: 'test' });
    test('name', () => expect(name).toBe('elderjs-handle-css'));
  });

  describe('#splitCssSourceMap', () => {
    test('v1', () => {
      const [code, map] = splitCssSourceMap(cssCode1);
      expect(code).toBe(
        '.banner.svelte-ga2h7w{padding:1rem 2rem;background:#eee;border-radius:2rem;margin-bottom:1rem}.entries.svelte-ga2h7w{display:grid;grid-template-columns:1fr;margin:3rem 0}@media(min-width: 768px){.entries.svelte-ga2h7w{display:grid;grid-template-columns:1fr 1fr 1fr;margin:3rem 0}.entries .entry{margin-right:1rem}}.entry{padding:1rem;border:1px solid #ddd;border-radius:1rem;margin-bottom:1rem;background:white}.about.svelte-ga2h7w{margin-bottom:2rem}@media(min-width: 768px){.hydrate.svelte-ga2h7w{display:grid;grid-template-columns:80% 20%}}.hooks.svelte-ga2h7w{display:grid;grid-template-columns:100%}@media(min-width: 768px){.hooks.svelte-ga2h7w{grid-template-columns:50% 50%}}',
      );
      expect(map).toContain(sourceMapPrefix);
      expect(map).toContain(
        `eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9tZS5zdmVsdGUiLCJzb3VyY2VzIjpbIkhvbWUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ`,
      );
    });

    test('v2', () => {
      const [code, map] = splitCssSourceMap(cssCode2);
      expect(code).toBe(
        '.list.svelte-1y4dd2k.svelte-1y4dd2k{display:block;margin-bottom:0.5rem;font-size:13px}.list.svelte-1y4dd2k .code.svelte-1y4dd2k{cursor:help}.hook.svelte-1y4dd2k.svelte-1y4dd2k{max-width:100%;text-overflow:wrap;padding:1rem;border:1px solid #ddd;border-collapse:collapse;margin-bottom:1rem;border-radius:1rem;position:relative;background:white}.hook-number.svelte-1y4dd2k.svelte-1y4dd2k{position:absolute;top:0;right:0px;width:2rem;height:1.75rem;border-top-right-radius:1rem;border-bottom-left-radius:1rem;text-align:center;padding-top:3px;background:#ddd;font-size:14px}.overview.svelte-1y4dd2k.svelte-1y4dd2k{margin-right:1rem}@media(min-width: 768px){.hook.svelte-1y4dd2k.svelte-1y4dd2k:nth-child(even){margin-left:0.5rem}.hook.svelte-1y4dd2k.svelte-1y4dd2k:nth-child(odd){margin-right:0.5rem}}.use.svelte-1y4dd2k.svelte-1y4dd2k{font-size:14px}.use ul{padding-left:1rem}.overview.svelte-1y4dd2k.svelte-1y4dd2k{margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid #ddd}',
      );
      expect(map).toBe(
        `/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9va0RldGFpbC5zdmVsdGUiLCJzb3VyY2VzIjpbIkhvb2tEZXRhaWwuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGV4cG9ydCBsZXQgaG9vaztcbiAgZXhwb3J0IGxldCBpO1xuICBleHBvcnQgbGV0IGhvb2tFbnRpdHlEZWZpbm`,
      );
    });
  });

  describe('#transform', () => {
    test('That it returns empty string for css', () => {
      const { transform } = rollupPluginHandleCss({ rootDir: 'test' });
      expect(transform(cssCode1, '/Users/nick/repos/elderjs/template/src/components/Simple.css')).toBe('');
    });
  });

  describe('#renderChunk', () => {
    it('Single file finds the needed css', () => {
      const { transform, renderChunk } = rollupPluginHandleCss({ rootDir: '/Users/nick/repos/elderjs/template' });
      transform(cssCode1, '/Users/nick/repos/elderjs/template/src/routes/simple/Simple.css');
      const output = renderChunk('', simpleSvelte);
      expect(output).toContain(`module.exports._css = ["${cssCode1.substr(0, 30)}`);
      // eslint-disable-next-line no-useless-escape
      expect(output).toContain(`module.exports._cssIncluded = ["routes/Simple.css\"]`);
      expect(output).toContain(`module.exports._cssMap = `);
      expect(output).toContain(`sourceMappingURL=data:application`);
    });

    it('Home.svelte works normal rollup mode and finds multiple dependencies', () => {
      const { transform, renderChunk } = rollupPluginHandleCss({ rootDir: '/Users/nick/repos/elderjs/template' });
      transform(
        `BlogTeaser${sourceMapPrefix}BlogTeaser`,
        '/Users/nick/repos/elderjs/template/src/components/BlogTeaser.css',
      );
      transform(
        `HookDetail${sourceMapPrefix}HookDetail`,
        '/Users/nick/repos/elderjs/template/src/components/HookDetail.css',
      );
      transform(`Clock${sourceMapPrefix}Clock`, '/Users/nick/repos/elderjs/template/src/components/Clock.css');
      transform(`Home${sourceMapPrefix}Home`, '/Users/nick/repos/elderjs/template/src/routes/home/Home.css');
      const output = renderChunk('', homeSvelte);
      expect(output).toContain(`module.exports._css = ["Home","HookDetail","BlogTeaser","Clock"]`);
      // eslint-disable-next-line no-useless-escape
      expect(output).toContain(
        `module.exports._cssIncluded = ["routes/Home.css","components/HookDetail.css","components/BlogTeaser.css","components/Clock.css"]`,
      );
      expect(output).toContain(
        `module.exports._cssMap = ["\\u002F*# sourceMappingURL=data:application\\u002Fjson;charset=utf-8;base64,Home","\\u002F*# sourceMappingURL=data:application\\u002Fjson;charset=utf-8;base64,HookDetail","\\u002F*# sourceMappingURL=data:application\\u002Fjson;charset=utf-8;base64,BlogTeaser","\\u002F*# sourceMappingURL=data:application\\u002Fjson;charset=utf-8;base64,Clock"]`,
      );
    });
  });
});
