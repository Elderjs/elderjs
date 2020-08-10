import capitalizeFirstLetter from '../capitalizeFirstLetter';

test('#capitalizeFirstLetter', async () => {
  expect(capitalizeFirstLetter('abcd')).toBe('Abcd');
  expect(capitalizeFirstLetter('Abcd')).toBe('Abcd');
  expect(capitalizeFirstLetter('ABCD')).toBe('ABCD');
  expect(capitalizeFirstLetter(' bcd')).toBe(' bcd');
  expect(capitalizeFirstLetter('.bcd')).toBe('.bcd');
  expect(capitalizeFirstLetter('a b c d')).toBe('A b c d');
});
