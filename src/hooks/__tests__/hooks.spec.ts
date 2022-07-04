import hooks from '../index.js';
import {
  IBootstrapHook,
  IBuildCompleteHook,
  ICompileHtmlHook,
  IErrorHook,
  IMiddlewareHook,
  IRequestCompleteHook,
  IShortcodeHook,
  IStacksHook,
  ProcessedHook,
} from '../types';
import normalizeSnapshot from '../../utils/normalizeSnapshot.js';
import { Elder } from '../../core/Elder.js';

import { describe, test, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('../../externalHelpers', () => () => Promise.resolve({ permalink: vi.fn() }));

vi.mock('../../utils/prepareShortcodeParser', () => ({
  default: ({ customJsStack, cssStack, headStack }) => ({
    parse: (templateHtml) => {
      customJsStack.push('console.log("test");');
      cssStack.push('body{display:none;}');
      headStack.push('<title>Hello</title>');
      return Promise.resolve(`..${templateHtml}..`);
    },
  }),
}));

vi.mock('../../utils/Page', () => {
  return {
    default: vi.fn(() => ({
      html: () => Promise.resolve(`<html>new page</html>`),
    })),
  };
});

vi.mock('fs-extra', () => ({
  default: {
    existsSync: vi.fn(() => false),
    ensureDirSync: vi.fn(() => ''),
    writeJSONSync: vi.fn(() => ''),
    readdirSync: vi.fn(() => []),
    outputFileSync: vi
      .fn(() => '')
      .mockImplementationOnce(() => '')
      .mockImplementationOnce(() => {
        throw new Error('Failed to write');
      }),
  },
}));

const elder = new Elder({ context: 'test' });

let stacks = {
  bodyAttributesStack: [],
  htmlAttributesStack: [],
  headStack: [],
  cssStack: [],
  beforeHydrateStack: [],
  hydrateStack: [],
  customJsStack: [],
  footerStack: [],
  moduleJsStack: [],
  moduleStack: [],
};

let request = { permalink: '/foo/', route: 'test', type: 'test' };

beforeAll(() => {
  elder.bootstrap();
});

beforeEach(() => {
  stacks = {
    bodyAttributesStack: [],
    htmlAttributesStack: [],
    headStack: [],
    cssStack: [],
    beforeHydrateStack: [],
    hydrateStack: [],
    customJsStack: [],
    footerStack: [],
    moduleJsStack: [],
    moduleStack: [],
  };
  request = { permalink: '/foo/', route: 'test', type: 'test' };
});

describe('#hooks', () => {
  test('has valid priority', () => {
    expect(hooks.filter((h) => h.priority < 1 && h.priority > 100)).toEqual([]);
  });
  test('matchesSnapshot', () => {
    expect(normalizeSnapshot(hooks)).toMatchSnapshot();
  });
  test('elderAddExternalHelpers', async () => {
    await elder.bootstrap();
    const hook = elder.hooks
      .filter((h) => h.hook === 'bootstrap')
      .find((h) => h.name === 'elderAddExternalHelpers') as ProcessedHook<IBootstrapHook>;
    const c = await hook.run({ ...elder, helpers: { old: vi.fn(), ...elder.helpers } });
    expect(normalizeSnapshot(c)).toMatchSnapshot();
  });
  test('elderExpressLikeMiddleware', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderExpressLikeMiddleware') as ProcessedHook<IMiddlewareHook>;
    const router = () => 'router() was called';
    expect(
      await hook.run({
        ...elder,
        router,
        req: {},
        res: {},
        next: () => '',
        request,
      }),
    ).toBe('router() was called');
  });
  test('elderProcessShortcodes', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderProcessShortcodes') as ProcessedHook<IShortcodeHook>;
    const headStack = [];
    const cssStack = [];
    const customJsStack = [];
    expect(
      await hook.run({
        ...stacks,
        ...elder,
        headStack,
        cssStack,
        customJsStack,
        layoutHtml: '<html>hi</html>',
        query: {},
        request,
      }),
    ).toEqual({
      cssStack: ['body{display:none;}'],
      customJsStack: ['console.log("test");'],
      headStack: ['<title>Hello</title>'],
      layoutHtml: '..<html>hi</html>..',
    });
  });
  test('elderAddMetaCharsetToHead', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderAddMetaCharsetToHead') as ProcessedHook<IStacksHook>;
    expect(normalizeSnapshot(await hook.run({ ...elder, ...stacks, request, headStack: [] }))).toMatchSnapshot();
  });
  test('elderAddMetaViewportToHead', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderAddMetaViewportToHead') as ProcessedHook<IStacksHook>;
    expect(normalizeSnapshot(await hook.run({ ...elder, ...stacks, request, headStack: [] }))).toMatchSnapshot();
  });
  test('elderCompileHtml', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderCompileHtml') as ProcessedHook<ICompileHtmlHook>;
    expect(
      await hook.run({
        ...elder,
        request,
        headString: 'head',
        htmlString: '',
        htmlAttributesString: '',
        footerString: 'footer',
        bodyAttributesString: '',
        layoutHtml: 'layout',
      }),
    ).toStrictEqual({
      htmlString: '<!DOCTYPE html><html lang="en"><head>head</head><body class="test">layoutfooter</body></html>',
    });
  });

  test('elderConsoleLogErrors', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderConsoleLogErrors') as ProcessedHook<IErrorHook>;
    expect(
      await hook.run({ ...elder, settings: { ...elder.settings, worker: false }, request, errors: ['foo', 'bar'] }),
    ).toBeUndefined();
  });
  test('elderWriteHtmlFileToPublic', async () => {
    await elder;
    const hook = elder.hooks.find(
      (h) => h.name === 'elderWriteHtmlFileToPublic',
    ) as ProcessedHook<IRequestCompleteHook>;

    expect(
      await hook.run({
        ...elder,
        timings: [],
        request,
        htmlString: '<html>string</html>',
        errors: [],
      }),
    ).toBeNull();
    expect(
      await hook.run({
        ...elder,
        timings: [],
        request,
        htmlString: '<html>string</html>',
        errors: [],
        settings: {
          ...elder.settings,
          build: { numberOfWorkers: 1, shuffleRequests: false },
          distDir: process.cwd(),
        },
      }),
    ).toBeNull();
    expect(
      await hook.run({
        ...elder,
        timings: [],
        request,
        htmlString: '<html>string</html>',
        errors: [],
        settings: {
          ...elder.settings,
          distDir: process.cwd(),
          build: { numberOfWorkers: 1, shuffleRequests: false },
        },
      }),
    ).toEqual({ errors: [new Error('Failed to write')] });
  });
  test('elderDisplayRequestTime', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderDisplayRequestTime') as ProcessedHook<IRequestCompleteHook>;
    expect(
      await hook.run({
        ...elder,
        request,
        timings: [
          { name: 'foo', duration: 500 },
          { name: 'bar', duration: 250 },
        ],
        htmlString: '<html>string</html>',
        settings: {
          ...elder.settings,
          debug: {
            performance: true,
            hooks: false,
            stacks: false,
            build: false,
            props: false,
            shortcodes: false,
          },
        },
      }),
    ).toBeUndefined();
  });
  test('elderShowParsedBuildTimes', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderShowParsedBuildTimes') as ProcessedHook<IBuildCompleteHook>;
    expect(
      await hook.run({
        ...elder,
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
        settings: {
          ...elder.settings,
          debug: {
            performance: true,
            hooks: false,
            stacks: false,
            build: false,
            props: false,
            shortcodes: false,
          },
        },
      }),
    ).toBeUndefined();
  });
  test('elderWriteBuildErrors', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderWriteBuildErrors');
    expect(normalizeSnapshot(hook)).toMatchSnapshot();
  });

  describe('#elderAddCssFileToHead', () => {
    test('respects settings.css = file', async () => {
      await elder;
      const hook = elder.hooks.find((h) => h.name === 'elderAddCssFileToHead') as ProcessedHook<IStacksHook>;
      expect(
        await hook.run({
          ...elder,
          ...stacks,
          request,
          errors: ['error1', 'error2'],
          headStack: [],
          settings: {
            ...elder.settings,
            css: 'file',
            $$internal: {
              ...elder.settings.$$internal,
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
      test('respects settings.css = lazy', async () => {
        await elder;
        const hook = elder.hooks.find((h) => h.name === 'elderAddCssFileToHead') as ProcessedHook<IStacksHook>;
        expect(
          await hook.run({
            ...elder,
            ...stacks,
            request,
            errors: ['error1', 'error2'],
            headStack: [],
            settings: {
              ...elder.settings,
              css: 'lazy',
              $$internal: {
                ...elder.settings.$$internal,
                files: {
                  publicCssFile: '/_elderjs/assets/svelte.123.js',
                },
              },
            },
          }),
        ).toEqual({
          headStack: [
            {
              priority: 30,
              source: 'elderAddCssFileToHead',
              string: `<link id="ejs-public-css" rel="preload" href="/_elderjs/assets/svelte.123.js" as="style" /><link rel="stylesheet" href="/_elderjs/assets/svelte.123.js" media="print" onload="this.media='all'" /><noscript><link rel="stylesheet" href="/_elderjs/assets/svelte.123.js" media="all" /></noscript>`,
            },
          ],
        });
      });
    });

    test('respects settings.css = inline', async () => {
      await elder;
      const hook = elder.hooks.find((h) => h.name === 'elderAddCssFileToHead') as ProcessedHook<IStacksHook>;
      expect(
        await hook.run({
          ...elder,
          ...stacks,
          request,
          errors: ['error1', 'error2'],
          headStack: [],
          settings: {
            ...elder.settings,
            css: 'inline',
          },
        }),
      ).toBeUndefined();
    });
    test('respects settings.css = none', async () => {
      await elder;
      const hook = elder.hooks.find((h) => h.name === 'elderAddCssFileToHead') as ProcessedHook<IStacksHook>;
      expect(
        await hook.run({
          ...elder,
          ...stacks,
          request,
          errors: ['error1', 'error2'],
          headStack: [],
          settings: {
            ...elder.settings,
            css: 'none',
          },
        }),
      ).toBeUndefined();
    });
  });
});
