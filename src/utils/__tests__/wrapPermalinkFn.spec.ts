import wrapPermalinkFn from '../wrapPermalinkFn';

const payload = { request: { slug: 'test' } };
const settings = {
  debug: {
    automagic: false,
  },
};

describe('#wrapPermalinkFn', () => {
  it('works on valid permalinks', () => {
    const permalinkFn = ({ request }) => `/${request.slug}/`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('works on homepage permalinks / ', () => {
    const permalinkFn = () => '/';
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/');
  });

  it('it adds a beginning slash', () => {
    const permalinkFn = ({ request }) => `${request.slug}/`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('it adds a trailing slash', () => {
    const permalinkFn = ({ request }) => `/${request.slug}`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('it adds both trailing and beginning', () => {
    const permalinkFn = ({ request }) => request.slug;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it("it throws when permalink fn doesn't return a string.", () => {
    const permalinkFn = ({ request }) => request;
    expect(() => wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload)).toThrow();
  });
});
