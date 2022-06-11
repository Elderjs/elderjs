import windowsPathFix from '../windowsPathFix.js';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

describe('#windowsPathFix', () => {
  it('windows path fix works', () => {
    expect(windowsPathFix('\\___ELDER___\\compiled\\layouts\\Layout.js')).toBe(
      '/___ELDER___/compiled/layouts/Layout.js',
    );
  });
  it("windows path doesn't break linux", () => {
    expect(windowsPathFix('/___ELDER___/compiled/layouts/Layout.js')).toBe('/___ELDER___/compiled/layouts/Layout.js');
  });
});
