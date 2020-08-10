import Page from './Page';

function prepareServer({ bootstrapComplete }) {
  // eslint-disable-next-line consistent-return
  return async function prepServer(req, res, next) {
    const {
      serverLookupObject,
      settings,
      query,
      helpers,
      data,
      routes,
      allRequests,
      runHook,
      errors,
      customProps,
    } = await bootstrapComplete;

    if (req.path) {
      let { path } = req;

      if (settings.server.prefix && settings.server.prefix.length > 0) {
        if (path.indexOf(settings.server.prefix) !== 0) {
          return next();
        }
      }

      if (path[path.length - 1] !== '/') {
        path += '/';
      }

      const requestObject = serverLookupObject[path];

      // if we have a requestObject then we know it is for ElderGuide
      if (requestObject) {
        const forPage = {
          request: requestObject,
          settings,
          query,
          helpers,
          data,
          route: routes[requestObject.route],
          runHook,
          allRequests,
          routes,
          errors,
          customProps,
        };

        await runHook('middleware', { ...forPage, req, next, res });

        const page = new Page(forPage);

        if (!res.headerSent) {
          res.setHeader('Content-Type', 'text/html');
          res.end(await page.html());
        }
      } else {
        if (settings.server.prefix && settings.server.prefix.length > 0) {
          res.setHeader('Content-Type', 'application/json');
          res.end('{ "error": "Unknown template" }');
        }

        next();
      }
    }
  };
}

// eslint-disable-next-line import/prefer-default-export
export { prepareServer };
