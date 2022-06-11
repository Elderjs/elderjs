import prepareInlineShortcode from '../prepareInlineShortcode.js';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import getConfig from '../getConfig.js';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

const defaultSettings = getConfig({ css: 'inline' });

describe('#prepareInlineShortcode', () => {
  it('works - no content, no props', async () => {
    const settings = {
      shortcodes: {
        openPattern: '<12345',
        closePattern: '54321>',
      },
    };
    const fn = prepareInlineShortcode({ settings: { ...defaultSettings, ...settings } });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(() => fn({})).toThrow('helpers.shortcode requires a name prop');
    expect(
      fn({
        name: 'Test',
        props: {},
        content: '',
      }),
    ).toEqual('<12345Test/54321>');
  });

  it('works - with content and props', async () => {
    const settings = {
      shortcodes: {
        openPattern: '<',
        closePattern: '>',
      },
    };
    const fn = prepareInlineShortcode({ settings: { ...defaultSettings, ...settings } });
    expect(
      fn({
        name: 'Test',
        props: {
          foo: 'bar',
          answer: 42,
          nested: {
            prop: 'porp',
          },
        },
        content: '<div>Hi, I am content</div>',
      }),
    ).toEqual("<Test foo='bar' answer='42' nested='{\"prop\":\"porp\"}'><div>Hi, I am content</div></Test>");
  });

  it('works - with \\ for escaped regex options', async () => {
    const settings = {
      shortcodes: {
        openPattern: '\\[',
        closePattern: '\\]',
      },
    };
    const fn = prepareInlineShortcode({ settings: { ...defaultSettings, ...settings } });
    expect(
      fn({
        name: 'Test',
        props: {
          foo: 'bar',
          answer: 42,
          nested: {
            prop: 'porp',
          },
        },
        content: '<div>Hi, I am content</div>',
      }),
    ).toEqual("[Test foo='bar' answer='42' nested='{\"prop\":\"porp\"}']<div>Hi, I am content</div>[/Test]");
  });
});
