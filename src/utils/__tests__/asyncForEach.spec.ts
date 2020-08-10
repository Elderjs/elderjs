import asyncForEach from '../asyncForEach';

test('#asyncForEach', () => {
  expect(asyncForEach([], jest.fn())).toBe([]);
});
