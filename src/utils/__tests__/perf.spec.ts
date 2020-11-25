import normalizeSnapshot from '../normalizeSnapshot';

class PerformanceObserverMock {
  cb: (any) => void;

  constructor(cb) {
    this.cb = cb;
  }

  observe() {
    this.cb({ getEntries: () => [{ name: 'Page-xxxxxxxx', duration: 0.05 }] });
  }

  disconnect() {
    this.cb = null;
  }
}

function MockPage() {
  this.uid = 'xxxxxxxx';
  this.htmlString = '';
}

describe('#perf', () => {
  it('works', () => {
    const calls = [];
    jest.mock('perf_hooks', () => ({
      PerformanceObserver: PerformanceObserverMock,
      performance: {
        mark: (i) => calls.push(`mark ${i}`),
        measure: (i) => calls.push(`measure ${i}`),
        clearMarks: (i) => calls.push(`clearMarks ${i}`),
      },
    }));
    const mockPage = new MockPage();
    // eslint-disable-next-line global-require
    const perf = require('../perf').default;

    // mutate
    perf(mockPage);

    mockPage.perf.start('test');
    mockPage.perf.end('test');
    mockPage.perf.stop();

    expect(normalizeSnapshot(mockPage)).toMatchSnapshot();
    expect(calls).toEqual([
      'clearMarks Page-xxxxxxxx',
      'mark test-start-xxxxxxxx',
      'mark test-end-xxxxxxxx',
      'measure test-xxxxxxxx',
    ]);
  });
});
