// import getHashedSvelteComponents from '../getHashedSvelteComponents';

jest.mock('path', () => {
  return {
    resolve: (...strings) => strings.join('/'),
    extname: (pattern) => pattern.split('.').pop(),
    basename: (file) => file.split('/').pop().split('.')[0],
  };
});

process.cwd = () => 'test';

const config = {
  srcDir: 'test',
  $$internal: {
    ssrComponents: 'ssr',
    clientComponents: 'client',
  },
};

describe('#getHashedSvelteComponents', () => {
  beforeEach(() => {
    // needed to reinitialize the import with empty results
    jest.resetModules();
  });
  it('throws when race condition.', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')]),
    }));
    // eslint-disable-next-line global-require
    const getHashedSvelteComponents = require('../getHashedSvelteComponents').default;
    let thrown = false;
    try {
      getHashedSvelteComponents(config);
    } catch (e) {
      thrown = true;
    }
    expect(thrown).toBeTruthy();
  });

  it('returns just the ssr when there are no entry/iife files', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce(() => [])
        .mockImplementationOnce(() => [])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'file1'), pattern.replace('*', 'file2')]),
    }));
    // eslint-disable-next-line global-require
    const getHashedSvelteComponents = require('../getHashedSvelteComponents').default;
    expect(getHashedSvelteComponents(config)).toEqual({
      file1: {
        iife: undefined,
        mjs: undefined,
      },
      file2: {
        iife: undefined,
        mjs: undefined,
      },
    });
    // from cache so glob mock is not needed
    expect(getHashedSvelteComponents(config)).toEqual({
      file1: {
        iife: undefined,
        mjs: undefined,
      },
      file2: {
        iife: undefined,
        mjs: undefined,
      },
    });
  });
  it('returns results', () => {
    jest.mock('glob', () => ({
      sync: jest
        .fn()
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'File1'), pattern.replace('*', 'File2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'File1'), pattern.replace('*', 'File2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'File1'), pattern.replace('*', 'File2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'iifeFile1'), pattern.replace('*', 'iifeFile2')])
        .mockImplementationOnce((pattern) => [pattern.replace('*', 'entryFile1'), pattern.replace('*', 'entryFile2')]),
    }));
    // eslint-disable-next-line global-require
    const getHashedSvelteComponents = require('../getHashedSvelteComponents').default;
    expect(getHashedSvelteComponents(config)).toEqual({
      File1: {
        mjs: 'entryFile1',
        iife: 'iifeFile1',
      },
      File2: {
        mjs: 'entryFile2',
        iife: 'iifeFile2',
      },
    });
    // from cache so glob mock is not needed
    expect(getHashedSvelteComponents(config)).toEqual({
      File1: {
        mjs: 'entryFile1',
        iife: 'iifeFile1',
      },
      File2: {
        mjs: 'entryFile2',
        iife: 'iifeFile2',
      },
    });
  });
});
