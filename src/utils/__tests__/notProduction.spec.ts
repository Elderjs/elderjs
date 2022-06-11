import notProduction from '../notProduction';

import { describe, it, expect } from 'vitest';

describe('#notProduction', () => {
  it('false on process.env.NODE_ENV === production', () => {
    process.env.NODE_ENV = 'production';
    expect(notProduction()).toBe(false);
  });
  it('false on process.env.NODE_ENV === PRODUCTION', () => {
    process.env.NODE_ENV = 'PRODUCTION';
    expect(notProduction()).toBe(false);
  });
  it('false on process.env.NODE_ENV === PRODUCtion', () => {
    process.env.NODE_ENV = 'PRODUCtion';
    expect(notProduction()).toBe(false);
  });

  it('true on process.env.NODE_ENV === dev', () => {
    process.env.NODE_ENV = 'dev';
    expect(notProduction()).toBe(true);
  });
  it('true on process.env.NODE_ENV === any', () => {
    process.env.NODE_ENV = 'any';
    expect(notProduction()).toBe(true);
  });
  it('true on process.env.NODE_ENV === undefined', () => {
    process.env.NODE_ENV = undefined;
    expect(notProduction()).toBe(true);
  });
});
