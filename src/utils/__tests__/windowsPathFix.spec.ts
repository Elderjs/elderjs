import windowsPathFix from '../windowsPathFix';

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
