import wrapPermalinkFn from '../wrapPermalinkFn';

const payload = { request: { slug: 'test' } };

describe('#wrapPermalinkFn', () => {
  it('works on valid permalinks', () => {
    const permalinkFn = ({ request }) => `/${request.slug}/`;
    const permalink = wrapPermalinkFn(permalinkFn, 'test')(payload);
    expect(permalink).toEqual('/test/');
  });

  it('it adds a beginning slash', () => {
    const permalinkFn = ({ request }) => `${request.slug}/`;
    const permalink = wrapPermalinkFn(permalinkFn, 'test')(payload);
    expect(permalink).toEqual('/test/');
  });

  it('it adds a trailing slash', () => {
    const permalinkFn = ({ request }) => `/${request.slug}`;
    const permalink = wrapPermalinkFn(permalinkFn, 'test')(payload);
    expect(permalink).toEqual('/test/');
  });

  it('it adds both trailing and beginning', () => {
    const permalinkFn = ({ request }) => request.slug;
    const permalink = wrapPermalinkFn(permalinkFn, 'test')(payload);
    expect(permalink).toEqual('/test/');
  });

  it("it throws when permalink fn doesn't return a string.", () => {
    const permalinkFn = ({ request }) => request;
    expect(() => wrapPermalinkFn(permalinkFn, 'test')(payload)).toThrow();
  });
});
