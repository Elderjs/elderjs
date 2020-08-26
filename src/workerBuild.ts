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
    customProps,
    allRequests,
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
      customProps,
    });
    const { errors: buildErrors, timings } = await page.build();
    i += 1;
    bTimes.push(timings);

    const response: any = ['requestComplete', i];
    if (buildErrors && buildErrors.length > 0) {
      errs += 1;
      response.push(errs);
      response.push({ request, errors: buildErrors });
      bErrors.push({ request, errors: buildErrors });
    } else {
      response.push(errs);
    }

    if (process.send) {
      process.send(response);
    }
  });
  return { timings: bTimes, errors: bErrors };
}

export default workerBuild;
