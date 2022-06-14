import { Elder } from '../core/Elder.js';

function prepareServer({ bootstrapComplete }: { bootstrapComplete: Promise<Elder> }) {
  return async function middleware(req, res, next) {
    try {
      const elder = await bootstrapComplete;

      await elder.runHook('middleware', {
        perf: elder.perf,
        errors: elder.errors,
        query: elder.query,
        helpers: elder.helpers,
        data: elder.data,
        settings: elder.settings,
        allRequests: elder.allRequests,
        routes: elder.routes,
        serverLookupObject: elder.serverLookupObject,
        runHook: elder.runHook,
        shortcodes: elder.shortcodes,
        router: elder.router,
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
