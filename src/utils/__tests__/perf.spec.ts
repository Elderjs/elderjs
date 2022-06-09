import normalizeSnapshot from '../normalizeSnapshot.js';

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

describe('#perf', () => {
  it('works in performance and mocks', () => {
    function MockPage() {
      this.uid = 'xxxxxxxx';
      this.htmlString = '';
      this.settings = {
        debug: {
          performance: true,
        },
      };
    }
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
    const perf = await import('../perf').default;

    // mutate
    perf(mockPage);

    mockPage.perf.start('test');
    mockPage.perf.end('test');

    const prefixed = mockPage.perf.prefix('prefix');

    prefixed.start('prefix');
    prefixed.end('prefix');

    mockPage.perf.stop();

    expect(normalizeSnapshot(mockPage)).toMatchSnapshot();
    expect(calls).toEqual([
      'clearMarks Page-xxxxxxxx',
      'mark test-start-xxxxxxxx',
      'mark test-end-xxxxxxxx',
      'measure test-xxxxxxxx',
      'mark prefix.prefix-start-xxxxxxxx',
      'mark prefix.prefix-end-xxxxxxxx',
      'measure prefix.prefix-xxxxxxxx',
    ]);
  });

  it('works in non performance', () => {
    function MockPage() {
      this.uid = 'xxxxxxxx';
      this.htmlString = '';
      this.settings = {
        debug: {
          performance: false,
        },
      };
    }
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
    const perf = await import('../perf').default;

    // mutate
    perf(mockPage);

    mockPage.perf.start('test');
    mockPage.perf.end('test');
    mockPage.perf.stop();

    expect(calls).toEqual([]);
  });
});
