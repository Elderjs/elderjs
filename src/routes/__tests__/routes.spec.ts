import routes from '../routes';

process.cwd = () => 'test';

jest.mock('path', () => ({
  resolve: (...strings) => strings.join('/').replace('./', '').replace('//', '/').slice(0, -1),
  join: (...strings) => strings.join('/').replace('./', '').replace('//', '/').slice(0, -1),
}));

jest.mock('glob', () => ({
  sync: jest
    .fn()
    .mockImplementationOnce(() => [
      'test/src/routes/Content/route.js',
      'test/src/routes/Content/Default.svelte',
      'test/src/routes/Home/Home.svelte',
      'test/src/routes/Home/route.js',
      'test/src/routes/Content/data.js',
      'test/src/routes/Content/Layout.svelte',
    ])
    .mockImplementationOnce(() => [])
    .mockImplementationOnce(() => [
      'test/___ELDER___/compiled/Home.js',
      'test/___ELDER___/compiled/AutoComplete.js',
      'test/___ELDER___/compiled/Default.js',
    ]),
}));

jest.mock('../../utils/svelteComponent', () => (component) => `<div class="svelteComponent">${component}</div>`);

jest.mock(
  'test/src/routes/Content/route.js',
  () => ({
    permalink: () => 'content-permalink',
    all: () => null,
    template: 'Default',
  }),
  { virtual: true },
);

jest.mock(
  'test/src/routes/Home/route.js',
  () => ({
    permalink: () => 'home-permalink',
    all: () => null,
  }),
  { virtual: true },
);

jest.mock('test/src/routes/Content/data.js', () => ({ foo: 'bar' }), { virtual: true });

test('#routes', () => {
  const settings = {
    debug: {
      automagic: true,
    },
    locations: {
      buildFolder: './___ELDER___/',
      srcFolder: './src/',
      svelte: {
        ssrComponents: './___ELDER___/compiled/',
        clientComponents: './public/dist/svelte/',
      },
    },
    typescript: false,
    hooks: {},
  };
  // @ts-ignore
  expect(routes(settings)).toMatchSnapshot();
});
