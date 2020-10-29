const outputStyles = require('../outputStyles');

const svelteCss = [
  { css: '.one{}', cssMap: 'one' },
  { css: '.two{}', cssMap: 'two' },
];

describe('#outputStyles', () => {
  it('on production returns css string, then merged svelte strings', () => {
    process.env.NODE_ENV = 'production';
    const result = outputStyles.default({
      request: { type: 'server' },
      svelteCss,
      cssString: '.cssString{}',
    });
    expect(result).toBe('<style>.cssString{}.one{}.two{}</style>');
  });

  it('on page.request.type="build" returns css string, then merged svelte strings', () => {
    process.env.NODE_ENV = 'dev';
    const result = outputStyles.default({
      request: { type: 'build' },
      svelteCss,
      cssString: '.cssString{}',
    });
    expect(result).toBe('<style>.cssString{}.one{}.two{}</style>');
  });

  it("when process.env.NODE_ENV is not production and isn't build, returns cssString wrapped in a style tag and svelte components in individual style tags", () => {
    process.env.NODE_ENV = 'dev';
    const result = outputStyles.default({
      request: { type: 'server' },
      svelteCss,
      cssString: '.cssString{}',
    });
    expect(result).toBe('<style>.cssString{}</style><style>.one{}one</style><style>.two{}two</style>');
  });

  it('when no svelte component css, it just returns the css string.', () => {
    process.env.NODE_ENV = 'dev';
    const result = outputStyles.default({
      request: { type: 'server' },
      svelteCss: [],
      cssString: '.cssString{}',
    });
    expect(result).toBe('<style>.cssString{}</style>');
  });
});
