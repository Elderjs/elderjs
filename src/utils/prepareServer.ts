function prepareServer({ bootstrapComplete }) {
  // eslint-disable-next-line consistent-return
  return async function prepServer(req, res, next) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { runHook, ...bootstrap } = await bootstrapComplete;
      await runHook('middleware', {
        ...bootstrap,
        runHook,
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

// eslint-disable-next-line import/prefer-default-export
export { prepareServer };
