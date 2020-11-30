/* eslint-disable no-param-reassign */
import cliProgress from 'cli-progress';
import os from 'os';
import cluster from 'cluster';

import getElderConfig from '../utils/getConfig';
import { Elder } from '../Elder';
import shuffleArray from '../utils/shuffleArray';
import { BuildResult, InitializationOptions } from '../utils/types';

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

async function build(initializationOptions: InitializationOptions = {}): Promise<void> {
  try {
    const settings = getElderConfig({ ...initializationOptions, context: 'build' });

    if (!settings.build) throw new Error('Is not a build. (Should never happen, for TS)');

    const multiLine = settings.debug.build;

    if (cluster.isMaster) {
      const start = Date.now();

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

      let workersProcessing: number = 0;
      let barInterval;
      let totalRequests: number = Infinity;

      const mElder = new Elder({ ...initializationOptions, context: 'build' });

      const mElderResults = await mElder.bootstrap();

      totalRequests = mElderResults.allRequests.length;
      let requestsToSplit = [...mElderResults.allRequests];
      if (settings.build.shuffleRequests) {
        requestsToSplit = shuffleArray(requestsToSplit);
      }

      let requestsPerWorker = Math.ceil(requestsToSplit.length / numberOfWorkers);
      if (requestsPerWorker < 100) requestsPerWorker = 100;

      numberOfWorkers = Math.ceil(totalRequests / requestsPerWorker);
      if (numberOfWorkers > maxNumberOfWorkers) numberOfWorkers = maxNumberOfWorkers;

      for (let i = 0; i < numberOfWorkers; i += 1) {
        cluster.fork();
      }

      const counts = {};
      if (!multiLine) {
        singlebar.start(requestsToSplit.length, 0, { pagesPerSecond: 0, errors: 0 });
      }

      let requestsProcessed = 0;

      // eslint-disable-next-line no-inner-declarations
      function prepareWorkerMessageHandler(workerId: string) {
        return function messageHandler(msg: Array<any>) {
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
            if (totalRequests === requestsProcessed) {
              markWorkersComplete({ errors, timings });
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
          }
        };
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const id in cluster.workers) {
        if (Object.prototype.hasOwnProperty.call(cluster.workers, id)) {
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

          const msgHandler = prepareWorkerMessageHandler(workerId);
          cluster.workers[id].on('message', msgHandler);

          const workerRequests = requestsToSplit.splice(0, requestsPerWorker);

          counts[workerId] = {
            id,
            count: 0,
            errCount: 0,
          };

          cluster.workers[id].send({ cmd: 'start', workerRequests, id });
        }
      }

      await workersComplete;

      clearInterval(barInterval);
      if (multiLine) {
        multibar.stop();
        // console.log(`Builds finished, shutting down workers`);
      } else {
        singlebar.stop();
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const id in cluster.workers) {
        if (Object.prototype.hasOwnProperty.call(cluster.workers, id)) {
          cluster.workers[id].kill();
        }
      }

      let success = true;

      mElder.errors = [...mElder.errors, ...errors];
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
      process.on('message', async (msg) => {
        if (msg.cmd === 'start') {
          const wElder = new Elder({ ...initializationOptions, context: 'build', worker: true });

          const results = await wElder.worker(msg.workerRequests);

          process.send(['done', results.timings]);
        }
      });
    }
  } catch (e) {
    if (e.message === 'Build did not complete successfully.') {
      process.exit(1);
    }
    console.error(e);
  }
}
export default build;
