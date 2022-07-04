import prepareRunHook from '../prepareRunHook.js';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

beforeAll(() => {
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

const hooks = [
  {
    hook: 'bootstrap',
    name: 'checkRequiredSettings',
    priority: 1,
    run: async ({ settings }) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (!settings.magicNumber) {
        throw new Error();
      }
      return {};
    },
  },
  {
    hook: 'bootstrap',
    name: 'pushError',
    priority: 2,
    run: async ({ errors }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      errors.push('something bad happened');
      return { errors };
    },
  },
  {
    hook: 'bootstrap',
    name: 'attempt to mutate settings',
    priority: 3,
    run: async ({ settings }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      settings.injection = 666;
      return { settings };
    },
  },
];

const allSupportedHooks = [
  {
    hook: 'bootstrap',
    props: ['settings', 'errors'],
    mutable: ['errors'],
    context: 'Super basic hook',
  },
  {
    hook: 'bootstrap-custom',
    props: ['settings', 'errors', 'customProp'],
    mutable: ['errors'],
    context: 'Super basic hook',
  },
];

describe('#prepareRunHook', () => {
  const settings = {
    debug: {
      hooks: true,
    },
    magicNumber: 42,
  };
  const perf = { start: vi.fn(), end: vi.fn(), prefix: () => '' };
  const {
    runHook: prepareRunHookFn,
    updateRunHookHookInterface,
    updateRunHookHooks,
  } = prepareRunHook({
    hooks: [hooks[0], hooks[1]],
    hookInterface: allSupportedHooks,
    settings,
  });

  it('throws for unknown hook', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    ///@ts-expect-error
    await expect(prepareRunHookFn('unknown', {})).rejects.toThrow();
  });

  it('works for bootstrap hook', async () => {
    const errors = [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    ///@ts-expect-error
    await expect(await prepareRunHookFn('bootstrap', { settings, errors, perf })).toEqual({
      errors: ['something bad happened'],
    });
    expect(errors).toEqual(['something bad happened']);
  });

  it('cannot mutate not mutable prop', async () => {
    updateRunHookHookInterface(allSupportedHooks);
    updateRunHookHooks(hooks);
    const errors = [];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    ///@ts-expect-error
    await prepareRunHookFn('bootstrap', { settings, errors, perf });
    expect(errors).toHaveLength(2);
    expect(errors[1]).toEqual('something bad happened');
  });
});
