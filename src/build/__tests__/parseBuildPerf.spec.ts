import parseBuildPerf from '../parseBuildPerf';

test('#parseBuildPerf', async () => {
  expect(parseBuildPerf([])).toEqual({});
  expect(parseBuildPerf([[]])).toEqual({});
  expect(parseBuildPerf([[{ name: 'foo', duration: -5 }]])).toEqual({ foo: -50 });
  expect(parseBuildPerf([[{ name: 'bar', duration: 0 }], [{ name: 'foo', duration: -5 }]])).toEqual({
    foo: -50,
    bar: 0,
  });
  expect(
    parseBuildPerf([
      [
        {
          name: 'task a',
          duration: 6894,
        },
        {
          name: 'task b',
          duration: 321,
        },
        {
          name: 'task c',
          duration: 255,
        },
      ],
      [
        {
          name: 'task c',
          duration: 510,
        },
        {
          name: 'task c',
          duration: 510,
        },
      ],
    ]),
  ).toEqual({
    'task a': 68940,
    'task b': 3210,
    'task c': 4250,
  });
});
