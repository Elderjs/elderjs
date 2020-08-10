import generate from 'nanoid/non-secure/generate';
import getUniqueId from '../getUniqueId';

jest.mock('nanoid/non-secure/generate');

generate.mockImplementation((_, len) => 'x'.repeat(len));

test('#getUniqueId', () => {
  expect(getUniqueId()).toBe('xxxxxxxxxx');
  expect(getUniqueId().length).toBe(10);
});
