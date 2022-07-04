import * as utils from '..';
import { test, expect, vi, beforeAll, beforeEach } from 'vitest';
beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});
test('includes all', () => {
  expect(Object.keys(utils)).toEqual([
    'capitalizeFirstLetter',
    'getUniqueId',
    'validateShortcode',
    'Page',
    'parseBuildPerf',
    'perf',
    'permalinks',
    'prepareRunHook',
    'validateHook',
    'validateRoute',
    'validatePlugin',
    'shuffleArray',
    'prepareServer',
    'prepareProcessStack',
    'getConfig',
    'getRollupConfig',
    'prepareInlineShortcode',
  ]);
});
