import normalizePrefix from '../normalizePrefix';

describe('#normalizePrefix', () => {
  const correctPrefix = '/testing';

  it('returns correct prefix providing a prefix without leading and trailing "/"', () => {
    const result = normalizePrefix('testing');

    expect(result).toEqual(correctPrefix);
  });

  it('returns correct prefix providing a prefix with a leading "/"', () => {
    const result = normalizePrefix('/testing');

    expect(result).toEqual(correctPrefix);
  });

  it('returns correct prefix providing a prefix with a trailing "/"', () => {
    const result = normalizePrefix('testing/');

    expect(result).toEqual(correctPrefix);
  });

  it('returns correct prefix providing a prefix with leading and trailing "/"', () => {
    const result = normalizePrefix('/testing/');

    expect(result).toEqual(correctPrefix);
  });

  it('returns correct prefix providing a prefix with multiple trailing "/"', () => {
    const result = normalizePrefix('testing//');

    expect(result).toEqual(correctPrefix);
  });
});
