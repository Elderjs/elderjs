import makeDynamicPermalinkFn from '../makeDynamicPermalinkFn.js';

describe('#makeRoutesjsPermalink', () => {
  it('works with basic fill in', () => {
    expect(makeDynamicPermalinkFn('/blog/:id/')({ request: { id: 'foo' } })).toEqual('/blog/foo/');
  });

  it('works with multiple fill in', () => {
    expect(makeDynamicPermalinkFn('/blog/:id/:comment/')({ request: { id: 'foo', comment: 1 } })).toEqual(
      '/blog/foo/1/',
    );
  });

  it('works with static', () => {
    expect(makeDynamicPermalinkFn('/blog/')({ request: { id: 'foo', comment: 1 } })).toEqual('/blog/');
  });
});
