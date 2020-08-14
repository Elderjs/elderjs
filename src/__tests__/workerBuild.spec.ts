import workerBuild from '../workerBuild';

jest.mock('../utils/Page', () => {
  return jest.fn().mockImplementation(() => ({
    build: () => Promise.resolve({ errors: [], timings: [{ name: 'foo', duration: 500 }] }),
  }));
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
  it('works', async () => {
    const processSendMock = jest.fn();
    process.send = processSendMock;
    expect(await workerBuild({ bootstrapComplete: Promise.resolve(input), workerRequests: input.allRequests })).toEqual(
      {
        errors: [],
        timings: [[{ duration: 500, name: 'foo' }], [{ duration: 500, name: 'foo' }]],
      },
    );
    expect(processSendMock).toHaveBeenCalledTimes(3);
  });
});
