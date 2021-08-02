import hooks from '../index';
import normalizeSnapshot from '../../utils/normalizeSnapshot';

jest.mock('../../externalHelpers', () => () => Promise.resolve({ permalink: jest.fn() }));

jest.mock('../../utils/prepareShortcodeParser', () => ({ customJsStack, cssStack, headStack }) => ({
  parse: (templateHtml) => {
    customJsStack.push('console.log("test");');
    cssStack.push('body{display:none;}');
    headStack.push('<title>Hello</title>');
    return Promise.resolve(`..${templateHtml}..`);
  },
}));

jest.mock('../../utils/Page', () => {
  return jest.fn(() => ({
    html: () => Promise.resolve(`<html>new page</html>`),
  }));
});

jest.mock('fs-extra', () => ({
  writeJSONSync: jest.fn(),
  outputFileSync: jest
    .fn()
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw new Error('Failed to write');
    }),
}));

describe('#hooks', () => {
  it('has valid priority', () => {
    expect(hooks.filter((h) => h.priority < 1 && h.priority > 100)).toEqual([]);
  });
  it('matchesSnapshot', () => {
    expect(normalizeSnapshot(hooks)).toMatchSnapshot();
  });
  it('elderAddExternalHelpers', async () => {
    const hook = hooks.find((h) => h.name === 'elderAddExternalHelpers');
    const c = await hook.run({ helpers: { old: jest.fn() }, query: {}, settings: {} });
    expect(normalizeSnapshot(c)).toMatchSnapshot();
  });
  it('elderExpressLikeMiddleware', async () => {
    const hook = hooks.find((h) => h.name === 'elderExpressLikeMiddleware');
    const router = () => 'router() was called';

    expect(await hook.run({ router })).toBe('router() was called');
  });
  it('elderProcessShortcodes', async () => {
    const hook = hooks.find((h) => h.name === 'elderProcessShortcodes');
    const headStack = [];
    const cssStack = [];
    const customJsStack = [];
    expect(
      await hook.run({
        headStack,
        cssStack,
        customJsStack,
        layoutHtml: '<html>hi</html>',
        helpers: {},
        query: {},
        settings: {},
      }),
    ).toEqual({
      cssStack: ['body{display:none;}'],
      customJsStack: ['console.log("test");'],
      headStack: ['<title>Hello</title>'],
      layoutHtml: '..<html>hi</html>..',
    });
  });
  it('elderAddMetaCharsetToHead', async () => {
    const hook = hooks.find((h) => h.name === 'elderAddMetaCharsetToHead');
    expect(normalizeSnapshot(await hook.run({ headStack: [] }))).toMatchSnapshot();
  });
  it('elderAddMetaViewportToHead', async () => {
    const hook = hooks.find((h) => h.name === 'elderAddMetaViewportToHead');
    expect(normalizeSnapshot(await hook.run({ headStack: [] }))).toMatchSnapshot();
  });
  it('elderCompileHtml', async () => {
    const hook = hooks.find((h) => h.name === 'elderCompileHtml');
    expect(
      await hook.run({
        request: { route: 'test' },
        headString: 'head',
        footerString: 'footer',
        layoutHtml: 'layout',
        settings: { lang: 'en' },
      }),
    ).toStrictEqual({
      htmlString: '<!DOCTYPE html><html lang="en"><head>head</head><body class="test">layoutfooter</body></html>',
    });
  });

  it('elderConsoleLogErrors', async () => {
    const hook = hooks.find((h) => h.name === 'elderConsoleLogErrors');
    expect(
      await hook.run({ settings: { worker: false }, request: { permalink: '/foo' }, errors: ['foo', 'bar'] }),
    ).toBeUndefined();
  });
  it('elderWriteHtmlFileToPublic', async () => {
    const hook = hooks.find((h) => h.name === 'elderWriteHtmlFileToPublic');
    expect(
      await hook.run({
        request: { permalink: '/foo' },
        htmlString: '<html>string</html>',
        errors: [],
        settings: {},
      }),
    ).toBeNull();
    expect(
      await hook.run({
        request: { permalink: '/foo' },
        htmlString: '<html>string</html>',
        errors: [],
        settings: { build: './build', locations: { public: './public' }, distDir: process.cwd() },
      }),
    ).toBeNull();
    expect(
      await hook.run({
        request: { permalink: '/foo' },
        htmlString: '<html>string</html>',
        errors: [],
        settings: { build: './build', locations: { public: './public' }, distDir: process.cwd() },
      }),
    ).toEqual({ errors: [new Error('Failed to write')] });
  });
  it('elderDisplayRequestTime', async () => {
    const hook = hooks.find((h) => h.name === 'elderDisplayRequestTime');
    expect(
      await hook.run({
        request: { permalink: '/foo' },
        timings: [
          { name: 'foo', duration: 500 },
          { name: 'bar', duration: 250 },
        ],
        settings: { debug: { performance: true } },
      }),
    ).toBeUndefined();
  });
  it('elderShowParsedBuildTimes', async () => {
    const hook = hooks.find((h) => h.name === 'elderShowParsedBuildTimes');
    expect(
      await hook.run({
        timings: [
          [
            { name: 'foo', duration: 500 },
            { name: 'bar', duration: 250 },
          ],
          [
            { name: 'foo', duration: 2500 },
            { name: 'bar', duration: 0 },
          ],
        ],
        settings: { debug: { performance: true } },
      }),
    ).toBeUndefined();
  });
  it('elderWriteBuildErrors', async () => {
    const hook = hooks.find((h) => h.name === 'elderWriteBuildErrors');
    expect(
      await hook.run({
        errors: ['error1', 'error2'],
        settings: { debug: { performance: true }, rootDir: process.cwd() },
      }),
    ).toBeUndefined();
  });

  describe('#elderAddCssFileToHead', () => {
    it('respects settings.css = file', async () => {
      const hook = hooks.find((h) => h.name === 'elderAddCssFileToHead');
      expect(
        await hook.run({
          errors: ['error1', 'error2'],
          headStack: [],
          settings: {
            css: 'file',
            $$internal: {
              publicCssFile: '/_elderjs/assets/svelte.123.js',
            },
          },
        }),
      ).toEqual({
        headStack: [
          {
            priority: 30,
            source: 'elderAddCssFileToHead',
            string: `<link rel="stylesheet" href="/_elderjs/assets/svelte.123.js" media="all" />`,
          },
        ],
      });
    });

    describe('#elderAddCssFileToHead', () => {
      it('respects settings.css = lazy', async () => {
        const hook = hooks.find((h) => h.name === 'elderAddCssFileToHead');
        expect(
          await hook.run({
            errors: ['error1', 'error2'],
            headStack: [],
            settings: {
              css: 'lazy',
              $$internal: {
                publicCssFile: '/_elderjs/assets/svelte.123.js',
              },
            },
          }),
        ).toEqual({
          headStack: [
            {
              priority: 30,
              source: 'elderAddCssFileToHead',
              string: `<link rel="preload" href="/_elderjs/assets/svelte.123.js" as="style" /><link rel="stylesheet" href="/_elderjs/assets/svelte.123.js" media="print" onload="this.media='all'" /><noscript><link rel="stylesheet" href="/_elderjs/assets/svelte.123.js" media="all" /></noscript>`,
            },
          ],
        });
      });
    });

    it('respects settings.css = inline', async () => {
      const hook = hooks.find((h) => h.name === 'elderAddCssFileToHead');
      expect(
        await hook.run({
          errors: ['error1', 'error2'],
          settings: { css: 'inline' },
        }),
      ).toBeUndefined();
    });
    it('respects settings.css = none', async () => {
      const hook = hooks.find((h) => h.name === 'elderAddCssFileToHead');
      expect(
        await hook.run({
          errors: ['error1', 'error2'],
          settings: { css: 'none' },
        }),
      ).toBeUndefined();
    });
  });
});
