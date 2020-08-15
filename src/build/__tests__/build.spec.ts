import { getWorkerCounts } from '../build';

jest.mock('os');
jest.mock('cli-progress');
jest.mock('../../Elder', () => ({
  Elder: class ElderMock {
    // eslint-disable-next-line class-methods-use-this
    worker() {
      return {
        errors: [],
        timings: [[{ duration: 500, name: 'foo' }], [{ duration: 500, name: 'foo' }]],
      };
    }
  },
  getElderConfig: () => ({
    debug: {
      build: true,
    },
  }),
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
});
