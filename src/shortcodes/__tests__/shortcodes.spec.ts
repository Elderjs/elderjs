import shortcodes from '..';

describe('#shortcodes', () => {
  it('contains all shortcodes we want', () => {
    expect(shortcodes).toEqual([
      {
        shortcode: 'svelteComponent',
        run: expect.any(Function),
        $$meta: {
          addedBy: 'elder',
          type: 'elder',
        },
      },
    ]);
  });

  it('[svelteComponent] run function behaves as expected', async () => {
    // throws error
    await expect(() =>
      shortcodes[0].run({
        props: {},
        helpers: null,
      }),
    ).rejects.toThrow('svelteComponent shortcode requires a name="" property.');
    // parse nothing
    expect(
      await shortcodes[0].run({
        props: {
          name: 'ParseNothing',
          something: 12,
        },
        helpers: {
          inlineSvelteComponent: ({ name, props, options }) =>
            `${name}${JSON.stringify(props)}${JSON.stringify(options)}`,
        },
      }),
    ).toEqual({
      html: 'ParseNothing{}{}',
    });
    expect(
      await shortcodes[0].run({
        props: {
          name: 'ParseProps',
          props: '{"foo":"bar", "count":42}',
        },
        helpers: {
          inlineSvelteComponent: ({ name, props, options }) =>
            `${name}${JSON.stringify(props)}${JSON.stringify(options)}`,
        },
      }),
    ).toEqual({
      html: 'ParseProps{"foo":"bar","count":42}{}',
    });
    expect(
      await shortcodes[0].run({
        props: {
          name: 'ParseOptions',
          options: '{"foo":"bar", "count":37}',
        },
        helpers: {
          inlineSvelteComponent: ({ name, props, options }) =>
            `${name}${JSON.stringify(props)}${JSON.stringify(options)}`,
        },
      }),
    ).toEqual({
      html: 'ParseOptions{}{"foo":"bar","count":37}',
    });
  });
});
