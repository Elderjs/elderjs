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
    },
  },
  {
    hook: 'bootstrap',
    name: 'pushError',
    priority: 2,
    run: async ({ errors }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      errors.push('something bad happened');
    },
  },
  {
    hook: 'bootstrap',
    name: 'attempt to mutate settings',
    priority: 3,
    run: async ({ settings }) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      settings.injection = 666;
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
    await expect(await prepareRunHookFn('bootstrap', { settings, errors, perf })).toEqual({});
    expect(errors).toEqual(['something bad happened']);
  });

  it('works for custom props', async () => {
    const errors = [];
    await expect(
      await prepareRunHookFn('bootstrap-custom', { settings, errors, perf, customProps: { customProp: 'testProp' } }),
    ).toEqual({
      customProps: {
        customProp: 'testProp',
      },
      errors: [],
      perf,
      settings: {
        debug: {
          hooks: true,
        },
        magicNumber: 42,
      },
    });
    expect(errors).toEqual([]);
  });

  it('cannot mutate not mutable prop', async () => {
    prepareRunHookFn = prepareRunHook({ hooks, allSupportedHooks, settings });
    const errors = [];
    await expect(prepareRunHookFn('bootstrap', { settings, errors, perf })).rejects.toThrow();
  });
});
