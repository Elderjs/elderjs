import normalizeSnapshot from '../normalizeSnapshot.js';
import perf from '../perf';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

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

    const mockPage = new MockPage();

    // mutate
    perf(mockPage);

    mockPage.perf.start('test');
    mockPage.perf.end('test');

    const prefixed = mockPage.perf.prefix('prefix');

    prefixed.start('prefix');
    prefixed.end('prefix');

    mockPage.perf.stop();

    expect(normalizeSnapshot(mockPage.perf.timings[0].name)).toBe('test');
    expect(normalizeSnapshot(mockPage.perf.timings[1].name)).toBe('prefix.prefix');
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

    const mockPage = new MockPage();

    // mutate
    perf(mockPage);

    mockPage.perf.start('test');
    mockPage.perf.end('test');
    mockPage.perf.stop();

    expect(mockPage.perf.timings).toEqual([]);
  });
});
