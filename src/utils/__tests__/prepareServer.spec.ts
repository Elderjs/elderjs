import { prepareServer } from '../prepareServer';

jest.mock('../Page');

describe('#prepareServer', () => {
  it('works', async () => {
    const hooks = [];
    const runHook = (hookName) => {
      hooks.push(hookName);
    };

    const input = {
      serverLookupObject: {
        '/dev/north-dakota/': {
          id: 37,
          slug: 'north-dakota',
          random: 82,
          route: 'state',
          type: 'server',
          premalink: '/north-dakota/',
        },
      },
      settings: { server: { prefix: '/dev' } },
      query: {
        db: {
          db: {},
          pool: {},
          cnString: {
            connectionString: 'postgresql://user:user@localhost:5099/db',
          },
        },
      },
      helpers: {
        permalinks: {},
        metersInAMile: 0.00062137119224,
      },
      data: {},
      routes: {
        state: {
          hooks: [],
          permalink: jest.fn(),
          all: jest.fn(),
          template: 'State.svelte',
          parent: 'home',
          breadcrumbLabel: jest.fn(),
          templateComponent: jest.fn(),
          data: jest.fn(),
          layout: jest.fn(),
          $$meta: { type: 'route', addedBy: 'routejs' },
        },
      },
      allRequests: [
        {
          id: 37,
          slug: 'north-dakota',
          random: 82,
          route: 'state',
          type: 'server',
          premalink: '/north-dakota/',
        },
      ],
      runHook,
      errors: [],
      customProps: {},
    };

    const bootstrapComplete = Promise.resolve(input);

    const prepServerFn = prepareServer({ bootstrapComplete });
    const nextMock = jest.fn(() => 'nextMockResult');
    const setHeaderMock = jest.fn();
    const endMock = jest.fn();
    const res = {
      setHeader: setHeaderMock,
      end: endMock,
    };
    expect(await prepServerFn({}, res, nextMock)).toEqual(undefined);
    // path doesn't include server prefix
    expect(
      await prepServerFn(
        {
          path: '/north-dakota',
        },
        res,
        nextMock,
      ),
    ).toEqual('nextMockResult');
    expect(nextMock).toHaveBeenCalledTimes(1);
    // request for path
    expect(
      await prepServerFn(
        {
          path: '/dev/north-dakota',
        },
        res,
        nextMock,
      ),
    ).toEqual(undefined);
    expect(hooks).toEqual(['middleware']);
    expect(setHeaderMock).toHaveBeenCalledTimes(1);
    expect(endMock).toHaveBeenCalledTimes(1);
    expect(nextMock).toHaveBeenCalledTimes(1); // no new calls
    // no requestObject
    expect(
      await prepServerFn(
        {
          path: '/dev/south-dakota',
        },
        res,
        nextMock,
      ),
    ).toEqual(undefined);
    expect(setHeaderMock).toHaveBeenCalledTimes(2);
    expect(endMock).toHaveBeenCalledTimes(2);
    expect(nextMock).toHaveBeenCalledTimes(2); // new call
  });
});
