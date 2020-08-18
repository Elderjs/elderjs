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
    {
      id: 38,
      slug: 'south-dakota',
      random: 42,
      route: 'state',
      type: 'server',
      premalink: '/south-dakota/',
    },
  ],
  runHook: jest.fn(),
  errors: [],
  customProps: {},
};

describe('#workerBuild', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('has build error', async () => {
    jest.mock('../utils/Page', () => {
      return jest.fn().mockImplementation(() => ({
        build: () => Promise.resolve({ errors: ['test error'], timings: [{ name: 'foo', duration: 500 }] }),
      }));
    });

    const processSendMock = jest.fn();
    process.send = processSendMock;
    // eslint-disable-next-line global-require
    const workerBuild = require('../workerBuild').default;
    expect(await workerBuild({ bootstrapComplete: Promise.resolve(input), workerRequests: input.allRequests })).toEqual(
      {
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
      },
    );
    expect(processSendMock).toHaveBeenCalledTimes(3);
  });

  it('works', async () => {
    jest.mock('../utils/Page', () => {
      return jest.fn().mockImplementation(() => ({
        build: () => Promise.resolve({ errors: [], timings: [{ name: 'foo', duration: 500 }] }),
      }));
    });

    const processSendMock = jest.fn();
    process.send = processSendMock;
    // eslint-disable-next-line global-require
    const workerBuild = require('../workerBuild').default;
    expect(await workerBuild({ bootstrapComplete: Promise.resolve(input), workerRequests: input.allRequests })).toEqual(
      {
        errors: [],
        timings: [[{ duration: 500, name: 'foo' }], [{ duration: 500, name: 'foo' }]],
      },
    );
    expect(processSendMock).toHaveBeenCalledTimes(3);
  });
});
