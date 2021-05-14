import wrapPermalinkFn from '../wrapPermalinkFn';

const payload = { request: { slug: 'test' } };
const settings = {
  debug: {
    automagic: false,
  },
};

describe('#wrapPermalinkFn', () => {
  const warn = jest.fn();
  console.warn = warn;

  it('works on valid permalinks', () => {
    const permalinkFn = ({ request }) => `/${request.slug}/`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('works on homepage permalinks /', () => {
    const permalinkFn = () => '/';
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/');
  });

  it('adds a beginning slash', () => {
    const permalinkFn = ({ request }) => `${request.slug}/`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('adds a trailing slash', () => {
    const permalinkFn = ({ request }) => `/${request.slug}`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('adds both trailing and beginning', () => {
    const permalinkFn = ({ request }) => request.slug;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it("throws when permalink fn doesn't return a string.", () => {
    const permalinkFn = ({ request }) => request;
    expect(() => wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload)).toThrow();
  });

  it('throws when permalink returns an undefined', () => {
    const permalinkFn = () => `//`;
    expect(() => wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload)).toThrow();
  });

  it('warn when permalink returns an undefined due to missing prop', () => {
    const permalinkFn = ({ request }) => `/${request.nope}/`;
    wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('warn when permalink returns an null due to missing prop', () => {
    const permalinkFn = () => '/null/';
    wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
