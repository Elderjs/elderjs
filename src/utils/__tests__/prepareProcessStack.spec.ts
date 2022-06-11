import { Elder } from '../../Elder.js';
import Page from '../Page.js';

import { test, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

const elder = new Elder({ context: 'test' });

const request = { permalink: '/foo/', route: 'test', type: 'test' };

test('#prepareProcessStack', async () => {
  await elder.bootstrap();

  const page = new Page({ ...elder, request, query: {}, route: {} });

  page.cssStack.push(
    {
      priority: 10,
      source: 'prepareProcessStack.spec', // used only for debugging
      string: '-10-',
    },
    {
      priority: 1,
      source: 'prepareProcessStack.spec',
      string: '-1-',
    },
    {
      // defaults to prio 50
      source: 'prepareProcessStack.spec',
      string: '-50-',
    },
  );

  expect(page.processStack('cssStack')).toEqual('-50--10--1-');
});
