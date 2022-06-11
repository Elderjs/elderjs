import {
  getType,
  walkAndCount,
  getName,
  prepareSubstitutions,
  walkAndSubstitute,
  isPrimitive,
} from '../propCompression';

import { describe, it, expect } from 'vitest';

const testObj = {
  a: 'b',
  b: 'c',
  c: { a: 'b', b: 'c', c: { a: 'b', b: 'c', c: { apple: false } } },
};

describe('#hydrateComponents', () => {
  it('#isPrimitative', () => {
    expect(isPrimitive({ foo: true })).toBe(false);
    expect(isPrimitive([])).toBe(false);
    expect(isPrimitive(1)).toBe(true);
    expect(isPrimitive(false)).toBe(true);
    expect(isPrimitive('yes')).toBe(true);
  });
  it('#getType', () => {
    expect(getType({})).toBe('Object');
    expect(getType([])).toBe('Array');
    expect(getType(false)).toBe('Boolean');
  });

  it('#walkAndCount', () => {
    const counts = new Map();
    walkAndCount(testObj, counts);
    expect([...counts]).toMatchObject([
      ['b', 6],
      ['a', 3],
      ['c', 6],
      [false, 1],
      ['apple', 1],
    ]);
  });

  it('#prepareSubstitutions', () => {
    const counts = new Map();
    const substitutions = new Map();
    const initialValues = new Map();
    const replacementChars = '$123';
    walkAndCount(testObj, counts);
    prepareSubstitutions({ counts, substitutions, initialValues, replacementChars });

    expect([...counts]).toMatchObject([
      ['b', 6],
      ['a', 3],
      ['c', 6],
      [false, 1],
      ['apple', 1],
    ]);
    expect([...substitutions]).toMatchObject([
      ['b', '$'],
      ['c', '1'],
      ['a', '2'],
    ]);
    expect([...initialValues]).toMatchObject([
      ['$', 'b'],
      ['1', 'c'],
      ['2', 'a'],
    ]);
  });

  it('#getName', () => {
    const counts = new Map();
    walkAndCount(testObj, counts);
    expect(getName(1, counts, '$123')).toBe('1');
  });

  it('#walkAndSubstitute', () => {
    const counts = new Map();
    const substitutions = new Map();
    const initialValues = new Map();
    const replacementChars = '$123';
    walkAndCount(testObj, counts);
    prepareSubstitutions({ counts, substitutions, initialValues, replacementChars });

    expect(walkAndSubstitute(testObj, substitutions)).toMatchObject({
      $: '1',
      '1': { $: '1', '1': { $: '1', '1': { apple: false }, '2': '$' }, '2': '$' },
      '2': '$',
    });
  });
});
