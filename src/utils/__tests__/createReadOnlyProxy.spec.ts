import { test, expect } from 'vitest';
import createReadOnlyProxy from '../createReadOnlyProxy.js';

test('#createReadOnlyProxy', () => {
  const readOnly = {
    name: 'I am just a read only object',
    doNotMutateMe: 42,
  };
  const proxy = createReadOnlyProxy(readOnly, 'readOnly', 'createReadOnlyProxy.spec.ts');
  try {
    proxy.doNotMutateMe = 55;
  } catch (e) {
    // expected
  }
  expect(proxy.doNotMutateMe).toBe(42);
  expect(proxy.name).toBe(readOnly.name);
});
