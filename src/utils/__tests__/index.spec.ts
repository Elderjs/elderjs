import * as utils from '..';

test('includes all', () => {
  expect(Object.keys(utils)).toEqual([
    'asyncForEach',
    'capitalizeFirstLetter',
    'svelteComponent',
    'getUniqueId',
    'validateShortcode',
    'IntersectionObserver',
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
