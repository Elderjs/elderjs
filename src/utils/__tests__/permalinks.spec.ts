import permalinks from '../permalinks.js';

import { ProcessedRouteOptions, ProcessedRoutesObject } from '../../routes/types.js';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { Elder } from '../../core/Elder.js';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

const elder = new Elder({ context: 'test' });

const commonRoute: ProcessedRouteOptions = {
  data: () => ({}),
  layout: 'test',
  all: [],
  template: 'test',
  templateComponent: () => 'test',
  permalink: () => '/test/',
  layoutComponent: () => 'test',
  name: 'test',
  dynamic: false,
  $$meta: {
    type: 'test',
    addedBy: 'test',
  },
};

describe('#permalinks', () => {
  const routes: ProcessedRoutesObject = {
    home: {
      ...commonRoute,
      name: 'home',
      permalink: ({ request, settings }) =>
        `${!settings.disableInitialSlash ? '/' : ''}${request ? request.query : ''}`,
    },
    blog: {
      ...commonRoute,
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
