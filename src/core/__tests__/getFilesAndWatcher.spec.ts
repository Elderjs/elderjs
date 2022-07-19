import path from 'path';
import { expect, test, vi } from 'vitest';
import { InternalFiles } from '../../utils/types';
import { updateFilesFn } from '../getFilesAndWatcher';

const first = [
  'test/elder.config.ts',
  'test/build/build.js',
  'test/build/cleanPublic.js',
  'test/build/hooks.js',
  'test/build/server.js',
  'test/build/shortcodes.js',
  'test/build/tsconfig.tsbuildinfo',
  'test/build/components/BlogTeaser.svelte',
  'test/build/components/Clock.svelte',
  'test/build/components/DisplayHooks.svelte',
  'test/build/components/HookDetail.svelte',
  'test/build/layouts/Layout.svelte',
  'test/build/routes/advanced/1.basic-route.md',
  'test/build/routes/advanced/Advanced.svelte',
  'test/build/routes/advanced/basic-route.md',
  'test/build/routes/advanced/data-plumbing.md',
  'test/build/routes/advanced/hooks.md',
  'test/build/routes/advanced/partial-hydration.md',
  'test/build/routes/advanced/plugins.md',
  'test/build/routes/advanced/prop-compression.md',
  'test/build/routes/advanced/route.js',
  'test/build/routes/advanced/routing.md',
  'test/build/routes/advanced/shortcodes.md',
  'test/build/routes/advanced/ssr.md',
  'test/build/routes/advanced/stacks.md',
  'test/build/routes/blog/Blog.svelte',
  'test/build/routes/blog/getting-started.md',
  'test/build/routes/blog/home.md',
  'test/build/routes/blog/how-to-build-a-blog-with-elderjs.md',
  'test/build/routes/blog/is-elderjs-right-for-you.md',
  'test/build/routes/blog/route.js',
  'test/build/routes/hooks/Hooks.svelte',
  'test/build/routes/hooks/route.js',
  'test/build/routes/simple/Simple.svelte',
  'test/build/routes/simple/route.js',
  'test/build/routes/ssr/Ssr.svelte',
  'test/build/routes/ssr/route.js',
  'test/___ELDER___/compiled/components/BlogTeaser.js',
  'test/___ELDER___/compiled/components/Clock.js',
  'test/___ELDER___/compiled/components/DisplayHooks.js',
  'test/___ELDER___/compiled/components/HookDetail.js',
  'test/___ELDER___/compiled/layouts/Layout.js',
  'test/___ELDER___/compiled/routes/advanced/Advanced.js',
  'test/___ELDER___/compiled/routes/blog/Blog.js',
  'test/___ELDER___/compiled/routes/hooks/Hooks.js',
  'test/___ELDER___/compiled/routes/simple/Simple.js',
  'test/___ELDER___/compiled/routes/ssr/Ssr.js',
  'test/public/_elderjs/svelte/chunks/chunk.BFER7IGE.js',
  'test/public/_elderjs/svelte/chunks/chunk.VLX2NJWY.js',
  'test/public/_elderjs/svelte/components/BlogTeaser.3AUXOWM7.js',
  'test/public/_elderjs/svelte/components/Clock.RXDT3EO6.js',
  'test/public/_elderjs/svelte/components/DisplayHooks.IHTGJQ3I.js',
  'test/public/_elderjs/svelte/components/HookDetail.MCOLEGK2.js',
  'test/public/style copy.css',
  'test/public/style.css',
  'test/public/_elderjs/assets/svelte-3bcbf5032efa392596bf0a3f1bdcce7e.css',
];
const second = [
  'test/elder.config.ts',
  'test/build/build.js',
  'test/build/cleanPublic.js',
  'test/build/hooks.js',
  'test/build/server.js',
  'test/build/shortcodes.js',
  'test/build/tsconfig.tsbuildinfo',
  'test/build/components/BlogTeaser.svelte',
  'test/build/components/Clock.svelte',
  'test/build/components/DisplayHooks.svelte',
  'test/build/components/HookDetail.svelte',
  'test/build/layouts/Layout.svelte',
  'test/build/routes/advanced/1.basic-route.md',
  'test/build/routes/advanced/Advanced.svelte',
  'test/build/routes/advanced/basic-route.md',
  'test/build/routes/advanced/data-plumbing.md',
  'test/build/routes/advanced/hooks.md',
  'test/build/routes/advanced/partial-hydration.md',
  'test/build/routes/advanced/plugins.md',
  'test/build/routes/advanced/prop-compression.md',
  'test/build/routes/advanced/route.js',
  'test/build/routes/advanced/routing.md',
  'test/build/routes/advanced/shortcodes.md',
  'test/build/routes/advanced/ssr.md',
  'test/build/routes/advanced/stacks.md',
  'test/build/routes/blog/Blog.svelte',
  'test/build/routes/blog/getting-started.md',
  'test/build/routes/blog/home.md',
  'test/build/routes/blog/how-to-build-a-blog-with-elderjs.md',
  'test/build/routes/blog/is-elderjs-right-for-you.md',
  'test/build/routes/blog/route.js',
  'test/build/routes/hooks/Hooks.svelte',
  'test/build/routes/hooks/route.js',
  'test/build/routes/simple/Simple.svelte',
  'test/build/routes/simple/route.js',
  'test/build/routes/ssr/Ssr.svelte',
  'test/build/routes/ssr/route.js',
  'test/___ELDER___/compiled/components/BlogTeaser.js',
  'test/___ELDER___/compiled/components/Clock.js',
  'test/___ELDER___/compiled/components/DisplayHooks.js',
  'test/___ELDER___/compiled/components/HookDetail.js',
  'test/___ELDER___/compiled/layouts/Layout.js',
  'test/___ELDER___/compiled/routes/advanced/Advanced.js',
  'test/___ELDER___/compiled/routes/blog/Blog.js',
  'test/___ELDER___/compiled/routes/hooks/Hooks.js',
  'test/___ELDER___/compiled/routes/simple/Simple.js',
  'test/___ELDER___/compiled/routes/ssr/Ssr.js',
  'test/public/_elderjs/svelte/chunks/chunk.BFER7IGE.js',
  'test/public/_elderjs/svelte/chunks/chunk.VLX2NJWY.js',
  'test/public/_elderjs/svelte/components/BlogTeaser.3AUXOWM7.js',
  'test/public/_elderjs/svelte/components/Clock.CHANGED.js',
  'test/public/_elderjs/svelte/components/DisplayHooks.IHTGJQ3I.js',
  'test/public/_elderjs/svelte/components/HookDetail.MCOLEGK2.js',
  'test/public/style copy.css',
  'test/public/style.css',
  'test/public/_elderjs/assets/svelte-3bcbf5032efa392596bf0a3f1bdcce7e.css',
];

vi.mock('fast-glob', () => ({
  default: {
    sync: vi
      .fn()
      .mockImplementationOnce(() => [...first])
      .mockImplementationOnce(() => [...second]),
  },
}));

vi.mock('../../utils/getUniqueId.js', () => ({
  default: () => 'test',
}));

test('#updateFilesFn > Checks pass by reference, finding the right files, single glob', async () => {
  const settings = {
    srcDir: 'test/build',
    distDir: 'test/public',
    ssrComponents: 'test/___ELDER___/compiled/',
    clientComponents: 'test/public/_elderjs/svelte/',
    configFiles: ['test/elder.config.ts'],
  };
  const updateFiles = (files) => () =>
    updateFilesFn({
      files,
      settings,
      paths: [
        `${settings.srcDir}/**/*`,
        `${settings.ssrComponents}/**/*.js`,
        `${settings.clientComponents}/**/*.js`,
        `${settings.distDir}/**/*.css`,
        ...settings.configFiles,
      ],
    });

  const files = {} as InternalFiles;
  const update = updateFiles(files);
  update();
  expect(files).toBe(files);
  expect(files.all).toEqual(first);
  expect(files).toMatchSnapshot();

  update();

  expect(files).toBe(files);
  expect(files.all).toEqual(second);
  expect(files).toMatchSnapshot();
});
