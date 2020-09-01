import tsConfigExist from '../tsConfigExist';

class StatSyncError extends Error {
  code: 'ENOENT';

  constructor(msg: string) {
    super(msg);
    this.code = 'ENOENT';
  }
}

jest.mock('fs', () => {
  return {
    statSync: (path) => {
      if (path.startsWith('test')) {
        throw new StatSyncError('');
      }
      if (path.startsWith('folder')) {
        throw new Error('');
      }
      return {};
    },
  };
});

test('#tsConfigExist - Error NO ENTity', () => {
  process.cwd = () => 'test';
  expect(tsConfigExist()).toBe(false);
});

test('#tsConfigExist - Unknown error', () => {
  process.cwd = () => 'folder';
  expect(() => tsConfigExist()).toThrow('');
});

test('#tsConfigExist - statSync ok', () => {
  process.cwd = () => 'config';
  expect(tsConfigExist()).toBe(true);
});
