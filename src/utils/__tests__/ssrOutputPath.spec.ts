import ssrOutputPath from '../ssrOutputPath';

test('#ssrOutputPath', async () => {
  expect(ssrOutputPath('layouts/Layout.svelte')).toBe('layouts/Layout.svelte');
  expect(ssrOutputPath('routes/blog/Blog.svelte')).toBe('routes/Blog.svelte');
  expect(ssrOutputPath('routes/home/Home.svelte')).toBe('routes/Home.svelte');
  expect(ssrOutputPath('routes/hooks/Hooks.svelte')).toBe('routes/Hooks.svelte');
  expect(ssrOutputPath('routes/simple/Simple.svelte')).toBe('routes/Simple.svelte');
  expect(ssrOutputPath('components/BlogTeaser.svelte')).toBe('components/BlogTeaser.svelte');
  expect(ssrOutputPath('components/Clock.svelte')).toBe('components/Clock.svelte');
  expect(ssrOutputPath('components/HookDetail.svelte')).toBe('components/HookDetail.svelte');
  expect(ssrOutputPath('components/MobileMenu.svelte')).toBe('components/MobileMenu.svelte');
  expect(ssrOutputPath('components/Navigation.svelte')).toBe('components/Navigation.svelte');
  expect(ssrOutputPath('node_modules/@elderjs/plugin-browser-reload/Test.svelte')).toBe(
    'plugins/plugin-browser-reload/Test.svelte',
  );
  expect(ssrOutputPath('plugins/elderjs-plugin-reload/SimplePlugin.svelte')).toBe(
    'plugins/elderjs-plugin-reload/SimplePlugin.svelte',
  );
  expect(ssrOutputPath('plugins/elderjs-plugin-reload/Test.svelte')).toBe('plugins/elderjs-plugin-reload/Test.svelte');
  expect(ssrOutputPath('src/components/BlogTeaser.svelte')).toBe('components/BlogTeaser.svelte');
  expect(ssrOutputPath('src/components/Clock.svelte')).toBe('components/Clock.svelte');
  expect(ssrOutputPath('src/components/HookDetail.svelte')).toBe('components/HookDetail.svelte');
  expect(ssrOutputPath('src/components/MobileMenu.svelte')).toBe('components/MobileMenu.svelte');
  expect(ssrOutputPath('src/components/Navigation.svelte')).toBe('components/Navigation.svelte');
  expect(ssrOutputPath('src/layouts/Layout.css')).toBe('layouts/Layout.css');
  expect(ssrOutputPath('src/components/HookDetail.css')).toBe('components/HookDetail.css');
  expect(ssrOutputPath('src/components/Navigation.css')).toBe('components/Navigation.css');
  expect(ssrOutputPath('src/components/MobileMenu.css')).toBe('components/MobileMenu.css');
  expect(ssrOutputPath('src/components/Clock.css')).toBe('components/Clock.css');
  expect(ssrOutputPath('src/routes/home/Home.css')).toBe('routes/Home.css');
  expect(ssrOutputPath('src/routes/hooks/Hooks.css')).toBe('routes/Hooks.css');
  expect(ssrOutputPath('src/routes/blog/Blog.css')).toBe('routes/Blog.css');
  expect(ssrOutputPath('src/routes/simple/Simple.css')).toBe('routes/Simple.css');
});
