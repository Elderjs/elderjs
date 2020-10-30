import getUniqueId from '../getUniqueId';

jest.mock('nanoid/non-secure', () => ({ customAlphabet: (_, len) => () => 'x'.repeat(len) }));

test('#getUniqueId', () => {
  expect(getUniqueId()).toBe('xxxxxxxxxx');
  expect(getUniqueId()).toHaveLength(10);
});
