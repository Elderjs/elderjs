/* eslint-disable no-param-reassign */
import prepareRunHook from '../prepareRunHook';

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
  const perf = { start: jest.fn(), end: jest.fn() };
  let prepareRunHookFn = prepareRunHook({ hooks: [hooks[0], hooks[1]], allSupportedHooks, settings });

  it('throws for unknown hook', async () => {
    await expect(prepareRunHookFn('unknown')).rejects.toThrow();
  });

  it('works for bootstrap hook', async () => {
    const errors = [];
    await expect(await prepareRunHookFn('bootstrap', { settings, errors, perf })).toEqual({
      errors: ['something bad happened'],
    });
    expect(errors).toEqual(['something bad happened']);
  });

  it('cannot mutate not mutable prop', async () => {
    prepareRunHookFn = prepareRunHook({ hooks, allSupportedHooks, settings });
    const errors = [];
    await prepareRunHookFn('bootstrap', { settings, errors, perf });
    expect(errors).toHaveLength(2);
    expect(errors[1]).toEqual('something bad happened');
  });
});
