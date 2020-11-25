/* eslint-disable max-classes-per-file */
import { getWorkerCounts } from '../build';

let calledHooks = [];

jest.mock('cosmiconfig', () => ({
  cosmiconfigSync: () => ({ search: () => null }),
}));

jest.mock('cli-progress');

jest.mock('../../utils/getConfig', () => () => ({
  debug: {
    build: true,
  },
  build: {
    numberOfWorkers: 5,
  },
}));

jest.mock('../../Elder', () => ({
  Elder: class ElderMock {
    errors: [];

    runHook: (string, any) => void;

    constructor() {
      this.errors = [];
      this.runHook = (h, opts) => {
        // push outside of class instance for assertion
        calledHooks.push(`${h}-${JSON.stringify(opts)}`);
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
}));

jest.mock('os', () => ({
  release: () => '',
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

class WorkerMock {
  id: number;

  handlers: {
    [event: string]: (...args: any) => any;
  };

  killed: boolean;

  withError: boolean; // mocked to send invalid message

  constructor(id, withError?: boolean) {
    this.id = id;
    this.handlers = {};
    this.killed = false;
    this.withError = withError || false;
  }

  on(event, cb) {
    this.handlers[event] = cb;
  }

  send({ cmd }) {
    if (cmd === 'start' && this.handlers.message) {
      this.handlers.message(['start']);
      this.handlers.message(['done']);
      if (this.withError) {
        this.handlers.message(['requestComplete', 3, 0, { errors: [`{"msg":"pushMeToErrors"}`] }]);
      } else {
        this.handlers.message(['requestComplete']);
      }
    }
  }

  kill() {
    this.killed = true;
    if (this.handlers.exit) {
      this.handlers.exit(this.id < 2 ? 0 : 500, this.id === 0 ? 'kill' : null);
    }
  }

  [Symbol.iterator]() {
    return this.id;
  }
}

describe('#build', () => {
  beforeEach(() => {
    jest.resetModules();
    calledHooks = [];
  });

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
      exit: () => '' as never,
    };

    // eslint-disable-next-line global-require
    const build = require('../build').default;
    await build();
    expect(listeners[0].event).toEqual('message');
    await listeners[0].cb({ cmd: 'start' });
    expect(sent[0]).toEqual(['done', [[{ duration: 500, name: 'foo' }], [{ duration: 500, name: 'foo' }]]]);
  });

  it('build works - master node, 5 workers', async () => {
    jest.useFakeTimers();
    process.env = {};

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
    jest.advanceTimersByTime(1000); // not all intervalls are cleared
    // eslint-disable-next-line global-require
    expect(require('cluster').workers.map((w) => w.killed)).toEqual([true, true, true, true, true]);
    expect(calledHooks).toEqual(['buildComplete-{"success":true,"errors":[],"timings":[null,null,null,null,null]}']);
    expect(setInterval).toHaveBeenCalledTimes(5);
  });

  it('build fails - different settings, 2 workers', async () => {
    jest.mock('../../Elder', () => ({
      Elder: class ElderMock {
        errors: string[];

        runHook: (string, any) => void;

        constructor() {
          this.errors = ['bornToFail'];
          this.runHook = (h, opts) => {
            // push outside of class instance for assertion
            calledHooks.push(`${h}-${JSON.stringify(opts)}`);
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
            allRequests: [0, 1],
          });
        }
      },
      getElderConfig: () => ({
        debug: {
          build: false,
        },
        build: {
          numberOfWorkers: -20,
          shuffleRequests: true,
        },
      }),
    }));
    jest.useFakeTimers();
    process.env = {
      ELDER_BUILD_NUMBER_OF_WORKERS: '2',
    };

    jest.mock('cluster', () => ({
      isMaster: true,
      fork: jest.fn(),
      workers: [new WorkerMock(0), new WorkerMock(1, true)],
    }));

    const dateNowStub = jest
      .fn()
      .mockImplementationOnce(() => 1530518257007)
      .mockImplementationOnce(() => 1530518257008)
      .mockImplementationOnce(() => 1530518307009)
      .mockImplementationOnce(() => 1530518307010)
      .mockImplementationOnce(() => 1530518307011)
      .mockImplementationOnce(() => 1530518307012)
      .mockImplementationOnce(() => 1530518307013)
      .mockImplementation(() => {
        throw new Error('unmocked Date call');
      });

    global.Date.now = dateNowStub;

    const realProcess = process;
    const exitMock = jest.fn();
    // @ts-ignore
    global.process = { ...realProcess, exit: exitMock };

    expect(calledHooks).toEqual([]);
    // eslint-disable-next-line global-require
    const build = require('../build').default;
    await build();
    jest.advanceTimersByTime(1000); // not all intervalls are cleared
    expect(setInterval).toHaveBeenCalledTimes(2);
    expect(exitMock).toHaveBeenCalled();

    // eslint-disable-next-line global-require
    expect(require('cluster').workers.map((w) => w.killed)).toEqual([true, true]);

    expect(calledHooks).toEqual([
      'buildComplete-{"success":false,"errors":["bornToFail",{"errors":[{"msg":"pushMeToErrors"}]}],"timings":[null,null]}',
    ]);
  });
});
