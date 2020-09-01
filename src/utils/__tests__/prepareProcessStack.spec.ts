import prepareProcessStack from '../prepareProcessStack';

test('#prepareProcessStack', () => {
  const page = {
    testStack: [
      {
        priority: 10,
        source: 'prepareProcessStack.spec', // used only for debugging
        string: '-10-',
      },
      {
        priority: 1,
        source: 'prepareProcessStack.spec',
        string: '-1-',
      },
      {
        // defaults to prio 50
        source: 'prepareProcessStack.spec',
        string: '-50-',
      },
    ],
    perf: {
      start: jest.fn(),
      end: jest.fn(),
    },
    settings: {
      debug: {
        stacks: true,
      },
    },
  };
  const processStackFn = prepareProcessStack(page);
  expect(processStackFn('testStack')).toEqual('-50--10--1-');
});
