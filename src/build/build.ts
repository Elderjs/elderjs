import cliProgress from 'cli-progress';
import os from 'os';
import cluster from 'cluster';
import { Elder } from '../core/Elder.js';
import shuffleArray from '../utils/shuffleArray.js';
import { BuildResult, InitializationOptions, RequestObject, SettingsOptions } from '../utils/types.js';
import { pbrReplaceArray } from '../core/passByReferenceUtils.js';

export function getWorkerCounts(counts) {
  return Object.keys(counts).reduce(
    (out, cv) => {
      out.count += counts[cv].count;
      out.errors += counts[cv].errCount;
      return out;
    },
    { count: 0, errors: 0 },
  );
}

function runOnAllWorkers(cb: (worker: cluster.Worker) => void) {
  // eslint-disable-next-line no-restricted-syntax
  for (const id in cluster.workers) {
    if (Object.prototype.hasOwnProperty.call(cluster.workers, id)) {
      cb(cluster.workers[id]);
    }
  }
}

function getNumberOfWorkersAndRequests(settings: Pick<SettingsOptions, 'build'>, requestCount: number) {
  if (!settings.build) throw new Error('Should never happen, build must be defined.');
  let maxNumberOfWorkers = os.cpus().length;
  if (maxNumberOfWorkers > 1) {
    if (settings.build.numberOfWorkers < 0) {
      maxNumberOfWorkers = os.cpus().length + settings.build.numberOfWorkers;
    } else if (settings.build.numberOfWorkers > 1) {
      maxNumberOfWorkers = settings.build.numberOfWorkers;
    }
  }

  if (
    process.env.ELDER_BUILD_NUMBER_OF_WORKERS &&
    Number(process.env.ELDER_BUILD_NUMBER_OF_WORKERS) > 0 &&
    !Number.isNaN(Number(process.env.ELDER_BUILD_NUMBER_OF_WORKERS))
  ) {
    maxNumberOfWorkers = Number(process.env.ELDER_BUILD_NUMBER_OF_WORKERS);
  }

  let numberOfWorkers = maxNumberOfWorkers;

  let requestsPerWorker = Math.ceil(requestCount / numberOfWorkers);
  if (requestsPerWorker < 100) requestsPerWorker = 100;

  numberOfWorkers = Math.ceil(requestCount / requestsPerWorker);
  if (numberOfWorkers > maxNumberOfWorkers) numberOfWorkers = maxNumberOfWorkers;

  return { numberOfWorkers, requestsPerWorker };
}

type WorkerRequestComplete = ['requestComplete', number, number?, { request: RequestObject; errors: string[] }?];
type WorkerStart = ['start', number];
type WorkerDone = ['done', Array<any[]>];

export type WorkerMessage = WorkerRequestComplete | WorkerStart | WorkerDone;

async function build(initializationOptions: InitializationOptions = {}): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    /// @ts-ignore
    if (cluster.isMaster || (typeof cluster.isPrimary !== 'undefined' && cluster.isPrimary)) {
      const mElder = new Elder({ ...initializationOptions, context: 'build' });

      const settings = await mElder.getSettings();

      if (!settings.build) throw new Error('Is not a build. (Should never happen, for TS)');

      const multiLine = settings.debug.build;
      const start = Date.now();

      let markWorkersComplete;
      const workersComplete = new Promise<BuildResult>((resolve) => {
        markWorkersComplete = resolve;
      });

      const errors = [];
      let timings = [];
      let multibar;
      let singlebar;

      if (multiLine) {
        multibar = new cliProgress.MultiBar(
          {
            clearOnComplete: false,
            hideCursor: true,
            forceRedraw: true,
            format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | Errors: {errors} | Avg: {avgRequestTime} ',
          },
          cliProgress.Presets.shades_grey,
        );
      } else {
        singlebar = new cliProgress.SingleBar(
          {
            clearOnComplete: false,
            hideCursor: true,
            forceRedraw: true,
            format:
              '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | Errors: {errors} | P/sec: {pagesPerSecond} ',
          },
          cliProgress.Presets.shades_classic,
        );
      }

      let workersProcessing = 0;
      let barInterval;
      let totalRequests = Infinity;

      const mElderResults = await mElder.bootstrap();

      totalRequests = mElderResults.allRequests.length;
      let requestsToSplit = [...mElderResults.allRequests];
      if (settings.build.shuffleRequests) {
        requestsToSplit = shuffleArray(requestsToSplit);
      }

      const { numberOfWorkers, requestsPerWorker } = getNumberOfWorkersAndRequests(settings, requestsToSplit.length);

      for (let i = 0; i < numberOfWorkers; i += 1) {
        cluster.fork();
      }

      const counts = {};
      if (!multiLine) {
        singlebar.start(requestsToSplit.length, 0, { pagesPerSecond: 0, errors: 0 });
      }

      let requestsProcessed = 0;

      const requests = {};

      // eslint-disable-next-line no-inner-declarations
      function prepareWorkerMessageHandler(workerId: string, worker: cluster.Worker) {
        return function messageHandler(msg: WorkerMessage) {
          if (msg[0] === 'requestComplete') {
            requestsProcessed += 1;
            // eslint-disable-next-line prefer-destructuring
            counts[workerId].count = msg[1];
            // eslint-disable-next-line prefer-destructuring
            counts[workerId].errCount = msg[2];
            if (msg[3]) {
              msg[3].errors = msg[3].errors.map((jsonErr) => JSON.parse(jsonErr));
              errors.push(msg[3]);
            }
          } else if (msg[0] === 'done') {
            timings = timings.concat(msg[1]);
            workersProcessing -= 1;
          } else if (msg[0] === 'start') {
            workersProcessing += 1;
            counts[workerId].startTime = Date.now();

            if (multiLine) {
              counts[workerId].bar = multibar.create(msg[1], 0, {
                avgRequestTime: 'Pending',
                errors: 0,
              });
            }

            if (numberOfWorkers === workersProcessing) {
              barInterval = setInterval(() => {
                if (multiLine) {
                  Object.keys(counts).forEach((id) => {
                    if (counts[id].bar) {
                      counts[id].bar.update(counts[id].count, {
                        errors: counts[id].errCount,
                        avgRequestTime: `${
                          Math.round(((Date.now() - counts[id].startTime) / counts[id].count) * 100) / 100
                        }ms`,
                      });
                    }
                  });
                } else {
                  const reduced = getWorkerCounts(counts);
                  const pps = Math.round((reduced.count / Math.round((Date.now() - start) / 1000)) * 100) / 100;
                  // console.log(reduced, pps);

                  singlebar.update(reduced.count, {
                    errors: reduced.errors,
                    pagesPerSecond: pps,
                  });
                }
              }, 300);
            }
          } else if (msg[0] === 'ready') {
            worker.send({ cmd: 'start', workerRequests: requests[worker.id], id: worker.id });
          }

          if (totalRequests === requestsProcessed && workersProcessing === 0) {
            markWorkersComplete({ errors, timings });
          }
        };
      }

      // eslint-disable-next-line no-restricted-syntax
      runOnAllWorkers((worker) => {
        const id = worker.id;
        const workerId = `worker-${id}`;

        if (settings.debug.build) {
          cluster.workers[id].on('exit', (code, signal) => {
            if (signal) {
              console.log(`worker-${id} was killed by signal: ${signal}`);
            } else if (code !== 0) {
              console.log(`worker-${id} exited with error code: ${code}`);
            } else {
              console.log(`worker-${id} successfully exited!`, code, signal);
            }
          });
        }

        const msgHandler = prepareWorkerMessageHandler(workerId, worker);
        cluster.workers[id].on('message', msgHandler);

        requests[id] = requestsToSplit.splice(0, requestsPerWorker);

        counts[workerId] = {
          id,
          count: 0,
          errCount: 0,
        };
      });

      await workersComplete;

      clearInterval(barInterval);
      if (multiLine) {
        multibar.stop();
        // console.log(`Builds finished, shutting down workers`);
      } else {
        singlebar.stop();
      }

      runOnAllWorkers((worker) => {
        worker.kill();
      });

      let success = true;

      pbrReplaceArray(mElder.errors, [...mElder.errors, ...errors]);

      if (mElder.errors.length > 0) {
        success = false;
      }

      const time = Date.now() - start;

      if (time > 60000) {
        console.log(
          `Build ${success ? 'Completed Successfully:' : 'Failed:'} Built ${totalRequests} pages in ${
            Math.round((time / 60000) * 100) / 100
          } minutes`,
        );
      } else if (time > 1000) {
        console.log(
          `Build ${success ? 'Completed Successfully:' : 'Failed:'} Built ${totalRequests} pages in ${
            Math.round((time / 1000) * 100) / 100
          } seconds`,
        );
      } else {
        console.log(
          `Build ${success ? 'Completed Successfully:' : 'Failed:'} Built ${totalRequests} pages in ${time}ms`,
        );
      }

      await mElder.runHook('buildComplete', { success, ...mElder, timings });

      if (settings.debug.build) {
        console.log('Build complete. Workers:', cluster.workers);
      }
      if (!success) {
        throw new Error(`Build did not complete successfully.`);
      }
    } else {
      process.send(['ready']);
      process.on('message', async (msg) => {
        if (msg.cmd === 'start') {
          try {
            const wElder = new Elder({ ...initializationOptions, context: 'build', worker: true });

            const results = await wElder.worker(msg.workerRequests);

            process.send(['done', results.timings]);
          } catch (e) {
            console.error(e);
          }
        }
      });
    }
  } catch (e) {
    console.error(e);
    if (e.message === 'Build did not complete successfully.') {
      process.exit(1);
    }
  }
}
export default build;
