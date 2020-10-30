import asyncForEach from '../asyncForEach';

test('#asyncForEach', async () => {
  const timeouts = [50, 10, 20];
  const counter = jest.fn();
  const cb = async (_, i) => {
    await new Promise((resolve) => setTimeout(resolve, timeouts[i]));
    counter(i);
  };
  await asyncForEach(['a', 'b', 'c'], cb);
  expect(counter.mock.calls).toHaveLength(3);
  // The first argument of the first call to the function was 0
  expect(counter.mock.calls[0][0]).toBe(0);
  // The first argument of the second call to the function was 1
  expect(counter.mock.calls[1][0]).toBe(1);
  // The first argument of the third call to the function was 2
  expect(counter.mock.calls[2][0]).toBe(2);
});
