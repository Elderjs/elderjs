import permalinks from '../permalinks.js';
import { Elder } from '../../Elder.js';
import { RoutesObject } from '../../routes/types.js';

const elder = new Elder({ context: 'server' });

describe('#permalinks', () => {
  const routes: RoutesObject = {
    home: {
      name: 'home',
      permalink: ({ request, settings }) =>
        `${!settings.disableInitialSlash ? '/' : ''}${request ? request.query : ''}`,
    },
    blog: {
      name: 'blog',
      permalink: ({ request, settings }) =>
        `${!settings.disableInitialSlash ? '/' : ''}blog/${request ? request.query : ''}`,
    },
  };
  it('works without prefix', async () => {
    await elder.bootstrap();
    const plinks: any = permalinks({ routes, settings: elder.settings });
    expect(plinks.blog()).toEqual('/blog/');
    expect(plinks.home()).toEqual('/');
  });
  it('works with passing data', async () => {
    await elder.bootstrap();

    const plinks: any = permalinks({ routes, settings: elder.settings });
    expect(plinks.blog({ query: '?a=b' })).toEqual('/blog/?a=b');
    expect(plinks.home({ query: '?c=d' })).toEqual('/?c=d');
  });
});
