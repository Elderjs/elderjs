function prepareServer({ bootstrapComplete }) {
  // eslint-disable-next-line consistent-return
  return async function prepServer(req, res, next) {
    const { runHook, ...bootstrap } = await bootstrapComplete;

    await runHook('middleware', {
      ...bootstrap,
      runHook,
      req,
      next,
      res,
      request: {},
    });
  };
}

// eslint-disable-next-line import/prefer-default-export
export { prepareServer };
