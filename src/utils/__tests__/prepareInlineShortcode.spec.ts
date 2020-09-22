import prepareInlineShortcode from '../prepareInlineShortcode';

describe('#prepareInlineShortcode', () => {
  it('works - no content, no props', () => {
    const settings = {
      shortcodes: {
        openPattern: '<12345',
        closePattern: '54321>',
      },
    };
    const fn = prepareInlineShortcode({ settings });
    // @ts-ignore
    expect(() => fn({})).toThrow('helpers.shortcode requires a name prop');
    expect(
      fn({
        name: 'Test',
        props: {},
        content: '',
      }),
    ).toEqual('<12345Test/54321>');
  });

  it('works - with content and props', () => {
    const settings = {
      shortcodes: {
        openPattern: '<',
        closePattern: '>',
      },
    };
    const fn = prepareInlineShortcode({ settings });
    expect(
      fn({
        name: 'Test',
        props: {
          foo: 'bar',
          answer: 42,
          nested: {
            prop: 'porp',
          },
        },
        content: '<div>Hi, I am content</div>',
      }),
    ).toEqual("<Test foo='bar' answer='42' nested='{\"prop\":\"porp\"}'><div>Hi, I am content</div></Test>");
  });

  it('works - with \\ for escaped regex options', () => {
    const settings = {
      shortcodes: {
        openPattern: '\\[',
        closePattern: '\\]',
      },
    };
    const fn = prepareInlineShortcode({ settings });
    expect(
      fn({
        name: 'Test',
        props: {
          foo: 'bar',
          answer: 42,
          nested: {
            prop: 'porp',
          },
        },
        content: '<div>Hi, I am content</div>',
      }),
    ).toEqual("[Test foo='bar' answer='42' nested='{\"prop\":\"porp\"}']<div>Hi, I am content</div>[/Test]");
  });
});
