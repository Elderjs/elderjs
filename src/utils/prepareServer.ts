import { Elder } from '../core/Elder.js';

function prepareServer({ bootstrapComplete }: { bootstrapComplete: Promise<Elder> }) {
  // eslint-disable-next-line consistent-return
  return async function prepServer(req, res, next) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const elder = await bootstrapComplete;
      await elder.runHook('middleware', {
        ...elder,
        req,
        next,
        res,
        request: { type: 'server' },
      });
    } catch (e) {
      console.error(e);
    }
  };
}

export { prepareServer };
