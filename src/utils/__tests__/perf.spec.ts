import perf from '../perf';

jest.mock('perf_hooks', () => {
  return {
    PerformanceObserver: function PerformanceObserver() {
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
    },
    performance: {
      mark: jest.fn(),
      measure: jest.fn(),
      clearMarks: jest.fn(),
    },
  };
});

function MockPage() {
  this.uid = 'xxxxxxxx';
  this.htmlString = '';
}

describe('#perf', () => {
  it('works', () => {
    const mockPage = new MockPage();
    // mutate
    perf(mockPage);

    mockPage.perf.start('test');
    mockPage.perf.end('test');
    mockPage.perf.stop();

    expect(mockPage).toMatchSnapshot();
  });
});
