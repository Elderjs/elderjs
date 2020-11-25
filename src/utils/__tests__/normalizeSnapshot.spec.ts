import normalizeSnapshot from '../normalizeSnapshot';

describe('#normalizeSnapshot', () => {
  const obj = {
    arr: ['\\elderjs\\elderjs\\test.js', '\\elderjs\\elderjs\\src.js', '/linuxpath/'],
    str: '\\test\\',
    obj: {
      linux: '/normal/path/here/',
      windows: '\\test\\it\\all\\',
      windowsArr: ['\\elderjs\\elderjs\\test.js', '\\elderjs\\elderjs\\src.js', '/linuxpath/'],
      obj: {
        linux: '/normal/path/here/',
        windows: '\\test\\it\\all\\',
        windowsArr: ['\\elderjs\\elderjs\\test.js', '\\elderjs\\elderjs\\src.js', '/linuxpath/'],
        obj: {
          linux: '/normal/path/here/',
          windows: '\\test\\it\\all\\',
          windowsArr: ['\\elderjs\\elderjs\\test.js', '\\elderjs\\elderjs\\src.js', '/linuxpath/'],
          obj: {
            linux: '/normal/path/here/',
            windows: '\\test\\it\\all\\',
            windowsArr: ['\\elderjs\\elderjs\\test.js', '\\elderjs\\elderjs\\src.js', '/linuxpath/'],
          },
        },
      },
    },
  };
  it('Properly converts windows paths on an object, array, string', () => {
    expect(normalizeSnapshot(obj)).toEqual({
      arr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
      obj: {
        linux: '/normal/path/here/',
        obj: {
          linux: '/normal/path/here/',
          obj: {
            linux: '/normal/path/here/',
            obj: {
              linux: '/normal/path/here/',
              windows: '/test/it/all/',
              windowsArr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
            },
            windows: '/test/it/all/',
            windowsArr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
          },
          windows: '/test/it/all/',
          windowsArr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
        },
        windows: '/test/it/all/',
        windowsArr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
      },
      str: '/test/',
    });
  });

  it('Returns nulls, undefineds, dates, etc', () => {
    expect(
      normalizeSnapshot({ ...obj, n: null, u: undefined, d: new Date('2020-11-25T14:09:06.448Z'), na: NaN }),
    ).toEqual({
      na: NaN,
      n: null,
      u: undefined,
      d: new Date('2020-11-25T14:09:06.448Z'),
      arr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
      obj: {
        linux: '/normal/path/here/',
        obj: {
          linux: '/normal/path/here/',
          obj: {
            linux: '/normal/path/here/',
            obj: {
              linux: '/normal/path/here/',
              windows: '/test/it/all/',
              windowsArr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
            },
            windows: '/test/it/all/',
            windowsArr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
          },
          windows: '/test/it/all/',
          windowsArr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
        },
        windows: '/test/it/all/',
        windowsArr: ['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/'],
      },
      str: '/test/',
    });
  });

  it('Handles fns', () => {
    const lamdba = () => 'foo';
    function fn() {
      return true;
    }
    expect(
      normalizeSnapshot({
        n: null,
        u: undefined,
        d: new Date('2020-11-25T14:09:06.448Z'),
        na: NaN,
        lamdba,
        fn,
      }),
    ).toMatchObject({
      na: NaN,
      n: null,
      u: undefined,
      d: new Date('2020-11-25T14:09:06.448Z'),
      lamdba,
      fn,
    });
  });

  it('Handles sets and maps', () => {
    const map = new Map();
    map.set('\\elderjs\\elderjs\\test.js', ['\\elderjs\\elderjs\\src.js', '/linuxpath/']);
    map.set('\\elderjs\\obj\\test.js', { '\\elderjs\\obj\\src.js': ['\\elderjs\\elderjs\\src.js', '/linuxpath/'] });

    const outMap = new Map();
    outMap.set('/elderjs/elderjs/test.js', ['/elderjs/elderjs/src.js', '/linuxpath/']);
    outMap.set('/elderjs/obj/test.js', { '/elderjs/obj/src.js': ['/elderjs/elderjs/src.js', '/linuxpath/'] });

    expect(
      normalizeSnapshot({
        set: new Set(['\\elderjs\\elderjs\\test.js', '\\elderjs\\elderjs\\src.js', '/linuxpath/']),
        map,
      }),
    ).toMatchObject({
      map: outMap,
      set: new Set(['/elderjs/elderjs/test.js', '/elderjs/elderjs/src.js', '/linuxpath/']),
    });
  });
});
