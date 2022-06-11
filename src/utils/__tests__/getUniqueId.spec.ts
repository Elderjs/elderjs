import { test, expect } from 'vitest';
import getUniqueId from '../getUniqueId.js';

test('#getUniqueId', () => {
  expect(getUniqueId()).toHaveLength(10);
});
