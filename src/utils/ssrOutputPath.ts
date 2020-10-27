import path from 'path';

const ssrOutputPath = (str) => {
  let name = '';
  const split = str.split(path.sep);
  if (split[0] === 'src') split.shift();
  if (!str.includes('node_modules')) {
    if (!str.includes('plugins')) {
      name = [split.shift(), split.pop()].join(path.sep);
    } else {
      name = split.join(path.sep);
    }
  } else {
    const last = split.pop();
    name = ['plugins', split.pop(), last].join(path.sep);
  }

  // TODO: for tests
  // layouts/Layout.svelte layouts/Layout.svelte
  // routes/blog/Blog.svelte routes/Blog.svelte
  // routes/home/Home.svelte routes/Home.svelte
  // routes/hooks/Hooks.svelte routes/Hooks.svelte
  // routes/simple/Simple.svelte routes/Simple.svelte
  // components/BlogTeaser.svelte components/BlogTeaser.svelte
  // components/Clock.svelte components/Clock.svelte
  // components/HookDetail.svelte components/HookDetail.svelte
  // components/MobileMenu.svelte components/MobileMenu.svelte
  // components/Navigation.svelte components/Navigation.svelte
  // node_modules/@elderjs/plugin-browser-reload/Test.svelte plugins/plugin-browser-reload/Test.svelte
  // plugins/elderjs-plugin-reload/SimplePlugin.svelte plugins/elderjs-plugin-reload/SimplePlugin.svelte
  // plugins/elderjs-plugin-reload/Test.svelte plugins/elderjs-plugin-reload/Test.svelte

  // src/components/BlogTeaser.svelte components/BlogTeaser.svelte
  // src/components/Clock.svelte components/Clock.svelte
  // src/components/HookDetail.svelte components/HookDetail.svelte
  // src/components/MobileMenu.svelte components/MobileMenu.svelte
  // src/components/Navigation.svelte components/Navigation.svelte

  // src/layouts/Layout.css layouts/Layout.css
  // src/components/HookDetail.css components/HookDetail.css
  // src/components/Navigation.css components/Navigation.css
  // src/components/MobileMenu.css components/MobileMenu.css
  // src/components/Clock.css components/Clock.css
  // src/routes/home/Home.css routes/Home.css
  // src/routes/hooks/Hooks.css routes/Hooks.css
  // src/routes/blog/Blog.css routes/Blog.css
  // src/routes/simple/Simple.css routes/Simple.css

  return name;
};
export default ssrOutputPath;
