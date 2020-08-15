/* eslint-disable max-classes-per-file */
import { getWorkerCounts } from '../build';

const calledHooks = [];

jest.mock('cli-progress');

jest.mock('../../Elder', () => ({
  Elder: class ElderMock {
    errors: [];

    runHook: (string) => void;

    constructor() {
      this.errors = [];
      this.runHook = (h) => {
        // push outside of class instance for assertion
        calledHooks.push(h);
      };
    }

    // eslint-disable-next-line class-methods-use-this
    worker() {
      return {
        errors: [],
        timings: [[{ duration: 500, name: 'foo' }], [{ duration: 500, name: 'foo' }]],
      };
    }

    // eslint-disable-next-line class-methods-use-this
    bootstrap() {
      return Promise.resolve({
        allRequests: [0, 1, 2, 3, 4],
      });
    }
  },
  getElderConfig: () => ({
    debug: {
      build: true,
    },
    build: {
      numberOfWorkers: 5,
    },
  }),
}));

jest.mock('os', () => ({
  cpus: () => [
    {
      model: 'Intel(R) Core(TM) i5-7200U CPU @ 2.50GHz',
      speed: 2712,
      times: { user: 900000, nice: 0, sys: 940265, idle: 11928546, irq: 147046 },
    },
    {
      model: 'Intel(R) Core(TM) i5-7200U CPU @ 2.50GHz',
      speed: 2712,
      times: { user: 860875, nice: 0, sys: 507093, idle: 12400500, irq: 27062 },
    },
  ],
}));

describe('#build', () => {
  beforeEach(() => jest.resetModules());

  it('getWorkerCounts works', () => {
    expect(getWorkerCounts({})).toEqual({ count: 0, errors: 0 });
    expect(getWorkerCounts({ a: { count: 1, errCount: 15 } })).toEqual({ count: 1, errors: 15 });
    expect(getWorkerCounts({ a: { count: 1, errCount: 15 }, b: { count: 625, errCount: 125 } })).toEqual({
      count: 626,
      errors: 140,
    });
  });

  it('build works - slave node', async () => {
    jest.mock('cluster', () => ({
      isMaster: false,
    }));

    const listeners = [];
    const sent = [];

    global.process = {
      // @ts-ignore
      on: (event, cb) => {
        listeners.push({ event, cb });
      },
      send: (i) => {
        sent.push(i);
        return true;
      },
    };

    // eslint-disable-next-line global-require
    const build = require('../build').default;
    await build();
    expect(listeners[0].event).toEqual('message');
    await listeners[0].cb({ cmd: 'start' });
    expect(sent[0]).toEqual(['done', [[{ duration: 500, name: 'foo' }], [{ duration: 500, name: 'foo' }]]]);
  });

  it('build works - master node, 5 workers', async () => {
    process.env = {};
    class WorkerMock {
      id: number;

      handlers: any;

      killed: boolean;

      constructor(id) {
        this.id = id;
        this.handlers = {};
        this.killed = false;
      }

      on(event, cb) {
        this.handlers[event] = cb;
      }

      send({ cmd }) {
        if (cmd === 'start' && this.handlers.message) {
          this.handlers.message(['start']);
          this.handlers.message(['done']);
          this.handlers.message(['requestComplete']);
        }
      }

      kill() {
        this.killed = true;
      }

      [Symbol.iterator]() {
        return this.id;
      }
    }

    jest.mock('cluster', () => ({
      isMaster: true,
      fork: jest.fn(),
      workers: [new WorkerMock(0), new WorkerMock(1), new WorkerMock(2), new WorkerMock(3), new WorkerMock(4)],
    }));

    const dateNowStub = jest
      .fn()
      .mockImplementationOnce(() => 1530518207007)
      .mockImplementationOnce(() => 1530528207007)
      .mockImplementationOnce(() => 1530528307007)
      .mockImplementationOnce(() => 1530528407007)
      .mockImplementationOnce(() => 1530528507007)
      .mockImplementationOnce(() => 1530528607007)
      .mockImplementationOnce(() => 1530528707007)
      .mockImplementation(() => {
        throw new Error('unmocked Date call');
      });

    global.Date.now = dateNowStub;

    expect(calledHooks).toEqual([]);
    // eslint-disable-next-line global-require
    const build = require('../build').default;
    await build();
    expect(calledHooks).toEqual(['buildComplete']);
  });
});
