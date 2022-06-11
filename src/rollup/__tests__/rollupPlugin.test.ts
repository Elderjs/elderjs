// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-ts-comment */

import path from 'path';
import fsExtra from 'fs-extra';
import getConfig from '../../utils/getConfig.js';
import { createSSRConfig } from '../getRollupConfig.js';
import { describe, it, expect, vi } from 'vitest';

const rollup = await import('rollup');

describe('#rollupPlugin', () => {
  const cfs = fsExtra.copyFileSync;
  const rds = fsExtra.readdirSync;
  const eds = fsExtra.ensureDirSync;

  // @ts-ignore
  fsExtra.copyFileSync = vi.fn(cfs);
  // @ts-ignore
  fsExtra.copyFileSync.mockImplementation(() => 'copied');
  // @ts-ignore
  fsExtra.readdirSync = vi.fn(rds);
  // @ts-ignore
  fsExtra.readdirSync.mockImplementation(() => ['style.css', 'style.css.map']);
  // @ts-ignore
  fsExtra.ensureDirSync = vi.fn(eds);
  // @ts-ignore
  fsExtra.ensureDirSync.mockImplementation(console.log);
  // @ts-ignore

  const elderConfig = getConfig({ css: 'inline' });

  it('SSR: Properly rolls up 3 components including _css and css output', async () => {
    const { input, plugins, output } = createSSRConfig({
      input: [
        path.resolve(`./src/rollup/__tests__/__fixtures__/simple/src/components/One.svelte`),
        path.resolve(`./src/rollup/__tests__/__fixtures__/simple/src/layouts/Two.svelte`),
        path.resolve(`./src/rollup/__tests__/__fixtures__/simple/src/routes/Three.svelte`),
      ],
      output: {
        dir: './___ELDER___/compiled/',
        format: 'cjs',
        exports: 'auto',
      },
      multiInputConfig: false,
      svelteConfig: {},
      elderConfig,
    });

    // @ts-ignore
    const bundle = await rollup.rollup({ input, plugins });

    // @ts-ignore
    const { output: out } = await bundle.generate({ output });

    expect(out).toHaveLength(5);

    // properly prioritizes css dependencies with components, routes, layouts in order
    // @ts-ignore
    const one = out.find((c) => c.facadeModuleId.endsWith('One.svelte'));
    // @ts-ignore
    expect(one.code).toContain(
      '.layout.svelte-1pyy034{background:purple}.route.svelte-plwlu6{background:#f0f8ff}.component.svelte-5m4l82{display:flex;flex-direction:column;font-size:14px}@media(min-width:768px){.component.svelte-5m4l82{flex-direction:row}}',
    );
    // @ts-ignore
    const two = out.find((c) => c.facadeModuleId.endsWith('Two.svelte'));
    // @ts-ignore
    expect(two.code).toContain('.layout.svelte-1pyy034{background:purple}.route.svelte-plwlu6{background:#f0f8ff}');
    // @ts-ignore
    const three = out.find((c) => c.facadeModuleId.endsWith('Three.svelte'));
    // @ts-ignore
    expect(three.code).toContain('.route.svelte-plwlu6{background:#f0f8ff}');

    const css = out.find((c) => c.name === 'svelte.css');
    // @ts-ignore
    expect(css.source).toContain(
      `.layout.svelte-1pyy034{background:purple}.route.svelte-plwlu6{background:#f0f8ff}.component.svelte-5m4l82{display:flex;flex-direction:column;font-size:14px}@media(min-width:768px){.component.svelte-5m4l82{flex-direction:row}}`,
    );
  });

  it.todo('SSR: Properly imports an npm dependency', async () => {
    const inputFiles = [
      path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/layouts/External.svelte`),
      path.resolve(`./src/rollup/__tests__/__fixtures__/external/src/components/Component.svelte`),
    ];
    vi.spyOn(process, 'cwd').mockReturnValue(path.resolve('./src/rollup/__tests__/__fixtures__/external'));

    // eslint-disable-next-line prefer-destructuring

    const { input, plugins, output } = createSSRConfig({
      input: inputFiles,
      output: {
        dir: './___ELDER___/compiled/',
        format: 'cjs',
        exports: 'auto',
      },
      multiInputConfig: false,
      svelteConfig: {},
      elderConfig,
    });

    // @ts-ignore
    const bundle = await rollup.rollup({ input, plugins });

    // @ts-ignore
    const { output: out } = await bundle.generate({ output });

    const css = out.find((c) => c.name === 'svelte.css');
    // @ts-ignore
    expect(css.source).toContain(
      `.layout.svelte-1e9whng{content:'we did it.'}.component.svelte-1be6npj{background:orange}`,
    );

    // css with the same priority is non-deterministic in the tests
    // node_modules is lowest priority

    expect(
      // @ts-ignore
      css.source.includes(
        `.icon.svelte-1kfpccr{background-color:#fff;border-radius:10px;width:10px;height:10px;color:#000}.button.svelte-11xgp0c{padding:10px 20px;background-color:#f50;color:#fff;font-weight:700}.layout.svelte-1e9whng{content:'we did it.'}.component.svelte-1be6npj{background:orange}`,
      ) ||
        // @ts-ignore
        css.source.includes(
          `.button.svelte-11xgp0c{padding:10px 20px;background-color:#f50;color:#fff;font-weight:700}.icon.svelte-1kfpccr{background-color:#fff;border-radius:10px;width:10px;height:10px;color:#000}.layout.svelte-1e9whng{content:'we did it.'}.component.svelte-1be6npj{background:orange}`,
        ),
    ).toBe(true);
    // @ts-ignore
    const externalSvelte = out.find((c) => c.facadeModuleId && c.facadeModuleId.endsWith('External.svelte'));
    // @ts-ignore
    expect(externalSvelte.code).toContain(
      '.button.svelte-11xgp0c{padding:10px 20px;background-color:#f50;color:#fff;font-weight:bold}',
    );
    // @ts-ignore
    const componentSvelte = out.find((c) => c.facadeModuleId.endsWith('Component.svelte'));
    // @ts-ignore
    expect(componentSvelte.code).toContain(
      '.icon.svelte-1kfpccr{background-color:#fff;border-radius:10px;width:10px;height:10px;color:#000}.component.svelte-1be6npj{background:orange}',
    );
  });

  fsExtra.copyFileSync = cfs;
  fsExtra.readdirSync = rds;
  fsExtra.ensureDirSync = eds;
});
