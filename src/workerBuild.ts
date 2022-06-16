import { WorkerMessage } from './build/build.js';
import { Elder, RequestObject } from './index.js';
import { Page } from './utils/index.js';

function sendMessage(msg: WorkerMessage) {
  process.send(msg);
}

async function workerBuild({
  bootstrapComplete,
  workerRequests,
}: {
  bootstrapComplete: Elder['bootstrapComplete'];
  workerRequests: RequestObject[];
}) {
  try {
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
      sendMessage(['start', workerRequests.length]);
    }

    let i = 0;
    let errs = 0;
    const bTimes = [];
    const bErrors = [];

    for (const request of workerRequests) {
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
        next: () => '',
      });
      i += 1;

      const { errors: buildErrors, timings } = await page.build();

      bTimes.push(timings);

      if (buildErrors && buildErrors.length > 0) {
        errs += 1;
        sendMessage([
          'requestComplete',
          i,
          errs,
          { request, errors: buildErrors.map((e) => JSON.stringify(e, Object.getOwnPropertyNames(e))) },
        ]);
        bErrors.push({ request, errors: buildErrors });
      } else {
        sendMessage(['requestComplete', i, errs]);
      }
    }
    return { timings: bTimes, errors: bErrors };
  } catch (e) {
    console.error(e);
    return { timings: [], errors: [e] };
  }
}

export default workerBuild;
