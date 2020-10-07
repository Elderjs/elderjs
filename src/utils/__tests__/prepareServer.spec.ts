import { prepareServer } from '../prepareServer';

describe('#prepareServer', () => {
  it('works', async () => {
    const hooks = [];
    const runHook = async (name, props) => {
      hooks.push({ name, props });
    };
    const nextMock = jest.fn();
    const prepServer = prepareServer({
      bootstrapComplete: Promise.resolve({
        runHook,
        foo: 'bar',
        bar: 'foo',
      }),
    });
    await prepServer(
      {
        desc: 'req',
      },
      {
        desc: 'res',
      },
      nextMock,
    );
    expect(hooks).toEqual([
      {
        name: 'middleware',
        props: {
          runHook,
          bar: 'foo',
          foo: 'bar',
          next: nextMock,
          req: {
            desc: 'req',
          },
          request: {},
          res: {
            desc: 'res',
          },
        },
      },
    ]);
  });
});
