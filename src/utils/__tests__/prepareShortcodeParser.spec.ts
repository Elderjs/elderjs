import prepareShortcodeParser from '../prepareShortcodeParser';

class ShortcodeParser {
  opts: any = {}; // just store them so we know what got passed over

  shortcodes: string[] = [];

  constructor(opts) {
    this.opts = opts;
  }

  add(shortcode: string, fn: (props: any, content: string) => Promise<string>) {
    fn({}, 'someContent').then(() => {
      this.shortcodes.push(shortcode);
    });
  }
}

jest.mock('@elderjs/shortcodes', () => (opts) => new ShortcodeParser(opts));
jest.mock('../createReadOnlyProxy');

const args = {
  helpers: {},
  data: {},
  request: {},
  query: {},
  allRequests: [],
  cssStack: [],
  headStack: [],
  customJsStack: [],
};

describe('#prepareShortcodeParser', () => {
  it('works with empty shortcodes', () => {
    const shortcodeParser = prepareShortcodeParser({
      ...args,
      shortcodes: [],

      settings: {
        debug: {
          stacks: true,
          hooks: true,
          build: true,
          automagic: true,
          shortcodes: true,
        },
        shortcodes: {
          openPattern: '\\[',
          closePattern: '\\]',
        },
      },
    });
    expect(shortcodeParser).toBeInstanceOf(ShortcodeParser);
    expect(shortcodeParser).toEqual({
      opts: {
        openPattern: '\\[',
        closePattern: '\\]',
      },
      shortcodes: [],
    });
  });

  it('throws errors if you try to add invalid shortcodes', () => {
    expect(() =>
      prepareShortcodeParser({
        ...args,
        shortcodes: [
          {
            run: jest.fn(),
            foo: 'bar',
          },
        ],
        settings: {
          debug: {
            stacks: true,
            hooks: true,
            build: true,
            automagic: true,
            shortcodes: true,
          },
          shortcodes: {
            openPattern: '\\<',
            closePattern: '\\>',
          },
        },
      }),
    ).toThrow(
      `Shortcodes must have a shortcode property to define their usage. Problem code: ${JSON.stringify({
        run: jest.fn(),
        foo: 'bar',
      })}`,
    );
    expect(() =>
      prepareShortcodeParser({
        ...args,
        shortcodes: [
          {
            shortcode: 'svelteComponent',
          },
        ],
        settings: {
          debug: {
            stacks: true,
            hooks: true,
            build: true,
            automagic: true,
            shortcodes: true,
          },
          shortcodes: {
            openPattern: '\\<',
            closePattern: '\\>',
          },
        },
      }),
    ).toThrow(`Shortcodes must have a run function. Problem code: ${JSON.stringify({ shortcode: 'svelteComponent' })}`);
  });

  it('works with valid shortcode that returns html but doesnt set anything else', async () => {
    const shortcodeParser = prepareShortcodeParser({
      ...args,
      shortcodes: [
        {
          shortcode: 'sayHi',
          run: async () => ({
            html: '<div>hi</div>',
          }),
        },
      ],
      settings: {
        debug: {
          stacks: true,
          hooks: true,
          build: true,
          automagic: true,
          shortcodes: true,
        },
        shortcodes: {
          openPattern: '\\👍',
          closePattern: '\\👎',
        },
      },
    });
    expect(shortcodeParser).toBeInstanceOf(ShortcodeParser);
    // wait for our mock class to run the functions to ensure coverage
    // CAUTION: this could turn out into non-deterministic test if the async fn doesn't finish
    await new Promise((r) => setTimeout(r, 250));
    expect(shortcodeParser).toEqual({
      opts: {
        openPattern: '\\👍',
        closePattern: '\\👎',
      },
      shortcodes: ['sayHi'],
    });
    expect(args.cssStack).toEqual([]);
    expect(args.headStack).toEqual([]);
    expect(args.customJsStack).toEqual([]);
  });

  it('works with valid shortcode that sets css, head and js', async () => {
    const shortcodeParser = prepareShortcodeParser({
      ...args,
      shortcodes: [
        {
          shortcode: 'svelteComponent',
          run: async () => ({
            css: 'body{font-size:1rem;}',
            js: 'alert("hello, I am test");',
            head: '<meta name="fromShortcode" content="it goes str8 to the head">',
          }),
        },
      ],
      settings: {
        debug: {
          stacks: true,
          hooks: true,
          build: true,
          automagic: true,
          shortcodes: true,
        },
        shortcodes: {
          openPattern: '\\66',
          closePattern: '\\33',
        },
      },
    });
    expect(shortcodeParser).toBeInstanceOf(ShortcodeParser);
    // wait for our mock class to run the functions to ensure coverage
    // CAUTION: this could turn out into non-deterministic test if the async fn doesn't finish
    await new Promise((r) => setTimeout(r, 250));
    expect(shortcodeParser).toEqual({
      opts: {
        openPattern: '\\66',
        closePattern: '\\33',
      },
      shortcodes: ['svelteComponent'],
    });
    expect(args.cssStack).toEqual([
      {
        source: `svelteComponent shortcode`,
        string: 'body{font-size:1rem;}',
      },
    ]);
    expect(args.headStack).toEqual([
      {
        source: `svelteComponent shortcode`,
        string: '<meta name="fromShortcode" content="it goes str8 to the head">',
      },
    ]);
    expect(args.customJsStack).toEqual([
      {
        source: `svelteComponent shortcode`,
        string: 'alert("hello, I am test");',
      },
    ]);
  });
});
