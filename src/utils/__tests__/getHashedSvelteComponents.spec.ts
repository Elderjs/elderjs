const config = {
  locations: {
    svelte: {
      ssrComponents: 'ssr',
      clientComponents: 'client',
    },
  },
};

describe('#getHashedSvelteComponents', () => {
  beforeEach(() => {
    // needed to reinitialize the import with empty results
    jest.resetModules();
  });
  it('returns results', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')]),
    }));
    // eslint-disable-next-line global-require
    const getHashedSvelteComponents = require('../getHashedSvelteComponents').default;
    expect(getHashedSvelteComponents(config)).toEqual({});
    // from cache so glob mock is not needed
    expect(getHashedSvelteComponents(config)).toEqual({});
  });
  it('returns empty if no entry files', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'File1'), pattern.replace('*', 'File2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'entryFile1'), pattern.replace('*', 'entryFile2')]),
    }));
    // eslint-disable-next-line global-require
    const getHashedSvelteComponents = require('../getHashedSvelteComponents').default;
    expect(getHashedSvelteComponents(config)).toEqual({
      File1: 'entryFile1',
      File2: 'entryFile2',
    });
    // from cache so glob mock is not needed
    expect(getHashedSvelteComponents(config)).toEqual({
      File1: 'entryFile1',
      File2: 'entryFile2',
    });
  });
});
