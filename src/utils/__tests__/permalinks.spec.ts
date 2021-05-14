import permalinks from '../permalinks';

describe('#permalinks', () => {
  const routes = {
    home: {
      permalink: ({ request, settings }) =>
        `${!settings.disableInitialSlash ? '/' : ''}${request ? request.query : ''}`,
    },
    blog: {
      permalink: ({ request, settings }) =>
        `${!settings.disableInitialSlash ? '/' : ''}blog/${request ? request.query : ''}`,
    },
  };
  it('works without prefix', () => {
    const settings = {};
    const plinks: any = permalinks({ routes, settings });
    expect(plinks.blog()).toEqual('/blog/');
    expect(plinks.home()).toEqual('/');
  });
  it('works with passing data', () => {
    const settings = {};
    const plinks: any = permalinks({ routes, settings });
    expect(plinks.blog({ query: '?a=b' })).toEqual('/blog/?a=b');
    expect(plinks.home({ query: '?c=d' })).toEqual('/?c=d');
  });
  it('works with settings', () => {
    const settings = { disableInitialSlash: true };
    const plinks: any = permalinks({ routes, settings });
    expect(plinks.blog()).toEqual('blog/');
    expect(plinks.home({ query: '?c=d' })).toEqual('?c=d');
  });
});
