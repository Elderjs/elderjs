import { prepareServer } from '../prepareServer.js';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

describe('#prepareServer', () => {
  it('works', async () => {
    const hooks = [];
    const runHook = async (name, props) => {
      hooks.push({ name, props });
    };
    const nextMock = vi.fn();
    const prepServer = prepareServer({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      bootstrapComplete: Promise.resolve({
        runHook,
      }),
    });
    await prepServer(
      {
        desc: 'req',
      },
      {
        desc: 'res',
      },
      nextMock,
    );
    expect(hooks).toEqual([
      {
        name: 'middleware',
        props: {
          runHook,
          allRequests: undefined,
          data: undefined,
          errors: undefined,
          helpers: undefined,
          perf: undefined,
          query: undefined,
          serverLookupObject: undefined,
          settings: undefined,
          shortcodes: undefined,
          router: undefined,
          routes: undefined,
          next: nextMock,
          req: {
            desc: 'req',
          },
          request: {
            type: 'server',
          },
          res: {
            desc: 'res',
          },
        },
      },
    ]);
  });
});
