import parseBuildPerf from '../parseBuildPerf';

test('#parseBuildPerf', async () => {
  expect(parseBuildPerf([])).toEqual({});
  expect(parseBuildPerf([[]])).toEqual({});
  expect(parseBuildPerf([[{ name: '1.1.1.1', duration: 1 }]])).toEqual({ '1': { '1': { '1': { '1': 1 } } } });
  expect(
    parseBuildPerf([
      [
        { name: '1', duration: 10 },
        { name: '1.1.1.1', duration: 1 },
      ],
    ]),
    // FIXME: rounding error?
  ).toEqual({ '1': { avg: 100, '1': { '1': { '1': 1 } } } });
  expect(
    parseBuildPerf([
      [
        { name: '1.1', duration: 10 },
        { name: '1.1.1.1', duration: 1 },
      ],
    ]),
  ).toEqual({ '1': { '1': { avg: 10, '1': { '1': 1 } } } });
  expect(parseBuildPerf([[{ name: '1.1.1', duration: 1 }]])).toEqual({ '1': { '1': { '1': 1 } } });
  expect(parseBuildPerf([[{ name: 'foo', duration: -5 }]])).toEqual({ foo: -50 });
  expect(parseBuildPerf([[{ name: 'bar', duration: 0 }], [{ name: 'foo', duration: -5 }]])).toEqual({
    foo: -50,
    bar: 0,
  });
  expect(
    parseBuildPerf([
      [{ name: 'foo.bar', duration: 0 }],
      [{ name: 'foo', duration: 0 }],
      [{ name: 'bar.foo', duration: -5 }],
      [{ name: 'bar.foo', duration: -10 }],
      [{ name: 'bar', duration: -15 }],
    ]),
  ).toEqual({
    foo: { bar: 0 },
    bar: { foo: -7.5, avg: -150 },
  });
  expect(
    parseBuildPerf([
      [{ name: 'foo', duration: 30 }],
      [{ name: 'bar', duration: 55 }],
      [{ name: 'foo.bar.1', duration: 15 }],
      // [{ name: 'foo.bar', duration: 30 }],
      [{ name: 'bar.foo.1', duration: 55 }],
      // [{ name: 'bar.foo', duration: 55 }],
      // [{ name: 'bar', duration: 55 }],
    ]),
  ).toEqual({
    foo: { bar: { '1': 15 }, avg: 300 },
    bar: { foo: { '1': 55 }, avg: 550 },
  });
  expect(
    parseBuildPerf([
      [
        {
          name: 'task.a.1.1',
          duration: 7520,
        },
        {
          name: 'task.b.2.1',
          duration: 400,
        },
        {
          name: 'task.c.3.1',
          duration: 180,
        },
        {
          name: 'task',
          duration: 8100,
        },
        {
          name: 'task.a',
          duration: 7520,
        },
        {
          name: 'task.a.1',
          duration: 7520,
        },
      ],
      [
        {
          name: 'task.a.1.1',
          duration: 6894,
        },
        {
          name: 'task.b.2.1',
          duration: 321,
        },
        {
          name: 'task.c.3.1',
          duration: 255,
        },
        {
          name: 'task',
          duration: 7470,
        },
      ],
      [
        {
          name: 'task.c.4.1',
          duration: 510,
        },
        {
          name: 'task.c.4.1',
          duration: 525,
        },
        {
          name: 'task.c.5.1',
          duration: 510,
        },
        {
          name: 'task',
          duration: 1545,
        },
      ],
    ]),
  ).toEqual({
    task: {
      avg: 57050,
      a: {
        avg: 7520,
        '1': {
          avg: 7520,
          '1': 7207,
        },
      },
      b: {
        '2': {
          '1': 360.5,
        },
      },
      c: {
        '3': { '1': 217.5 },
        '4': { '1': 517.5 },
        '5': { '1': 510 },
      },
    },
  });
});
