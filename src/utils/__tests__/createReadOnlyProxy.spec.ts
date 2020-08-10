import createReadOnlyProxy from '../createReadOnlyProxy';

test('#createReadOnlyProxy', () => {
  const readOnly = {
    name: 'I am just a read only object',
    doNotMutateMe: 42,
  };
  const proxy = createReadOnlyProxy(readOnly, 'readOnly', 'createReadOnlyProxy.spec.ts');
  try {
    // @ts-ignore
    proxy.doNotMutateMe = 55;
  } catch (e) {
    // expected
  }
  // @ts-ignore
  expect(proxy.doNotMutateMe).toBe(42);
  // @ts-ignore
  expect(proxy.name).toBe(readOnly.name);
});
