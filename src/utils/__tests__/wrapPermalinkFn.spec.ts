import wrapPermalinkFn from '../wrapPermalinkFn.js';
import { describe, it, expect, vi } from 'vitest';
import getConfig from '../getConfig.js';

const payload = { request: { slug: 'test', route: 'test', type: 'server' } };

describe('#wrapPermalinkFn', () => {
  it('works on valid permalinks', async () => {
    const settings = await getConfig({ css: 'inline' });
    const permalinkFn = ({ request }) => `/${request.slug}/`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('works on homepage permalinks /', async () => {
    const settings = await getConfig({ css: 'inline' });
    const permalinkFn = () => '/';
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/');
  });

  it('adds a beginning slash', async () => {
    const settings = await getConfig({ css: 'inline' });
    const permalinkFn = ({ request }) => `${request.slug}/`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('adds a trailing slash', async () => {
    const settings = await getConfig({ css: 'inline' });
    const permalinkFn = ({ request }) => `/${request.slug}`;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it('adds both trailing and beginning', async () => {
    const settings = await getConfig({ css: 'inline' });
    const permalinkFn = ({ request }) => request.slug;
    const permalink = wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(permalink).toEqual('/test/');
  });

  it("throws when permalink fn doesn't return a string.", async () => {
    const settings = await getConfig({ css: 'inline' });
    const permalinkFn = ({ request }) => request;
    expect(() => wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload)).toThrow();
  });

  it('throws when permalink returns an undefined', async () => {
    const settings = await getConfig({ css: 'inline' });
    const permalinkFn = () => `//`;
    expect(() => wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload)).toThrow();
  });

  it('warn when permalink returns an undefined due to missing prop', async () => {
    const settings = await getConfig({ css: 'inline' });
    const permalinkFn = ({ request }) => `/${request.nope}/`;
    const warn = vi.fn();
    console.warn = warn;

    wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('warn when permalink returns an null due to missing prop', async () => {
    const settings = await getConfig({ css: 'inline' });
    const warn = vi.fn();
    console.warn = warn;

    const permalinkFn = () => '/null/';
    wrapPermalinkFn({ permalinkFn, routeName: 'test', settings })(payload);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
