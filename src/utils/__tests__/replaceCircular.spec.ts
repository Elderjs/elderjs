import fixCircularJson from '../fixCircularJson.js';
import { describe, it, expect } from 'vitest';

describe('#fixCircularJson', () => {
  it('Handles circular', () => {
    const one = { f: 'this-should-work', b: undefined };
    const two = { h: 123, one };
    one.b = two;

    expect(JSON.stringify(fixCircularJson(one))).toBe('{"f":"this-should-work","b":{"h":123,"one":"[Circular]"}}');
  });
});
