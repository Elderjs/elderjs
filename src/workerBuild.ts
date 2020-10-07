import { asyncForEach, Page } from './utils';

async function workerBuild({ bootstrapComplete, workerRequests }) {
  const {
    settings,
    query,
    helpers,
    data,
    runHook,
    routes: workerRoutes,
    errors,
    allRequests,
    shortcodes,
  } = await bootstrapComplete;

  // potential issue that since builds are split across processes,
  // some plugins may need all requests of the same category to be passed at the same time.

  if (process.send) {
    process.send(['start', workerRequests.length]);
  }

  let i = 0;
  let errs = 0;
  const bTimes = [];
  const bErrors = [];

  await asyncForEach(workerRequests, async (request) => {
    const page = new Page({
      allRequests: workerRequests || allRequests,
      request,
      settings,
      query,
      helpers,
      data,
      route: workerRoutes[request.route],
      runHook,
      routes: workerRoutes,
      errors,
      shortcodes,
    });
    i += 1;
    const response: any = ['requestComplete', i];

    // try {
    const { errors: buildErrors, timings } = await page.build();
    bTimes.push(timings);

    if (buildErrors && buildErrors.length > 0) {
      errs += 1;
      response.push(errs);
      response.push({ request, errors: buildErrors.map((e) => JSON.stringify(e, Object.getOwnPropertyNames(e))) });
      bErrors.push({ request, errors: buildErrors });
    } else {
      response.push(errs);
    }
    // } catch (e) {}

    if (process.send) {
      process.send(response);
    }
  });
  return { timings: bTimes, errors: bErrors };
}

export default workerBuild;
