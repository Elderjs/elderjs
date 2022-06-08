import hooks from '../index';
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
import normalizeSnapshot from '../../utils/normalizeSnapshot';
import { Elder } from '../../Elder';

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
  ensureDirSync: jest.fn(),
  writeJSONSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  outputFileSync: jest
    .fn()
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw new Error('Failed to write');
    }),
}));

const elder = new Elder({ context: 'server' });

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
  return elder.bootstrap().then();
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
  it('has valid priority', () => {
    expect(hooks.filter((h) => h.priority < 1 && h.priority > 100)).toEqual([]);
  });
  it('matchesSnapshot', () => {
    expect(normalizeSnapshot(hooks)).toMatchSnapshot();
  });
  it('elderAddExternalHelpers', async () => {
    await elder;
    const hook = elder.hooks
      .filter((h) => h.hook === 'bootstrap')
      .find((h) => h.name === 'elderAddExternalHelpers') as ProcessedHook<IBootstrapHook>;
    const c = await hook.run({ ...elder, helpers: { old: jest.fn(), ...elder.helpers } });
    expect(normalizeSnapshot(c)).toMatchSnapshot();
  });
  it('elderExpressLikeMiddleware', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderExpressLikeMiddleware') as ProcessedHook<IMiddlewareHook>;
    const router = () => 'router() was called';
    expect(
      await hook.run({
        ...elder,
        router,
        req: {},
        res: {},
        next: () => {},
        request,
      }),
    ).toBe('router() was called');
  });
  it('elderProcessShortcodes', async () => {
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
  it('elderAddMetaCharsetToHead', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderAddMetaCharsetToHead') as ProcessedHook<IStacksHook>;
    expect(normalizeSnapshot(await hook.run({ ...elder, ...stacks, request, headStack: [] }))).toMatchSnapshot();
  });
  it('elderAddMetaViewportToHead', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderAddMetaViewportToHead') as ProcessedHook<IStacksHook>;
    expect(normalizeSnapshot(await hook.run({ ...elder, ...stacks, request, headStack: [] }))).toMatchSnapshot();
  });
  it('elderCompileHtml', async () => {
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

  it('elderConsoleLogErrors', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderConsoleLogErrors') as ProcessedHook<IErrorHook>;
    expect(
      await hook.run({ ...elder, settings: { ...elder.settings, worker: false }, request, errors: ['foo', 'bar'] }),
    ).toBeUndefined();
  });
  it('elderWriteHtmlFileToPublic', async () => {
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
  it('elderDisplayRequestTime', async () => {
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
            automagic: false,
            build: false,
            props: false,
            shortcodes: false,
          },
        },
      }),
    ).toBeUndefined();
  });
  it('elderShowParsedBuildTimes', async () => {
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
            automagic: false,
            build: false,
            props: false,
            shortcodes: false,
          },
        },
      }),
    ).toBeUndefined();
  });
  it('elderWriteBuildErrors', async () => {
    await elder;
    const hook = elder.hooks.find((h) => h.name === 'elderWriteBuildErrors');
    expect(normalizeSnapshot(hook)).toMatchSnapshot();
  });

  describe('#elderAddCssFileToHead', () => {
    it('respects settings.css = file', async () => {
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
      it('respects settings.css = lazy', async () => {
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
    it('respects settings.css = none', async () => {
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
