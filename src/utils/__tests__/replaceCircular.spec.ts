import fixCircularJson from '../fixCircularJson.js';

describe('#fixCircularJson', () => {
  it('Handles circular', () => {
    const one = { f: 'this-should-work', b: undefined };
    const two = { h: 123, one };
    one.b = two;

    expect(JSON.stringify(fixCircularJson(one))).toBe('{"f":"this-should-work","b":{"h":123,"one":"[Circular]"}}');
  });
});
