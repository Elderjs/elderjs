import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

const input = {
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
      permalink: vi.fn(),
      all: vi.fn(),
      template: 'State.svelte',
      parent: 'home',
      breadcrumbLabel: vi.fn(),
      templateComponent: vi.fn(),
      data: vi.fn(),
      layout: vi.fn(),
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
    {
      id: 38,
      slug: 'south-dakota',
      random: 42,
      route: 'state',
      type: 'server',
      premalink: '/south-dakota/',
    },
  ],
  runHook: vi.fn(),
  errors: [],
  customProps: {},
};

let mock = vi.mock('../utils/Page', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      build: () => Promise.resolve({ errors: ['test error'], timings: [{ name: 'foo', duration: 500 }] }),
    })),
  };
});

describe('#workerBuild', () => {
  it('has build error', async () => {
    const processSendMock = vi.fn();
    process.send = processSendMock;

    const workerBuild = await import('../workerBuild.js');

    // eslint-disable-next-line global-require
    expect(
      await workerBuild.default({ bootstrapComplete: Promise.resolve(input), workerRequests: input.allRequests }),
    ).toEqual({
      errors: [
        {
          errors: ['test error'],
          request: {
            id: 37,
            premalink: '/north-dakota/',
            random: 82,
            route: 'state',
            slug: 'north-dakota',
            type: 'server',
          },
        },
        {
          errors: ['test error'],
          request: {
            id: 38,
            premalink: '/south-dakota/',
            random: 42,
            route: 'state',
            slug: 'south-dakota',
            type: 'server',
          },
        },
      ],
      timings: [[{ duration: 500, name: 'foo' }], [{ duration: 500, name: 'foo' }]],
    });
    expect(processSendMock).toHaveBeenCalledTimes(3);
  });
});

it('works', async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mock = vi.mock('../utils/Page', () => {
    return {
      default: vi.fn().mockImplementation(() => ({
        build: () => Promise.resolve({ errors: [], timings: [{ name: 'foo', duration: 500 }] }),
      })),
    };
  });

  const processSendMock = vi.fn();
  process.send = processSendMock;
  // eslint-disable-next-line global-require
  const workerBuild = await import('../workerBuild.js');
  expect(
    await workerBuild.default({ bootstrapComplete: Promise.resolve(input), workerRequests: input.allRequests }),
  ).toEqual({
    errors: [],
    timings: [[{ duration: 500, name: 'foo' }], [{ duration: 500, name: 'foo' }]],
  });
  expect(processSendMock).toHaveBeenCalledTimes(3);
});
