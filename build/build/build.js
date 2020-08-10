"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_progress_1 = __importDefault(require("cli-progress"));
const os_1 = __importDefault(require("os"));
const cluster_1 = __importDefault(require("cluster"));
const Elder_1 = require("../Elder");
const shuffleArray_1 = __importDefault(require("../utils/shuffleArray"));
function getWorkerCounts(counts) {
    return Object.keys(counts).reduce((out, cv) => {
        out.count += counts[cv].count;
        out.errors += counts[cv].errCount;
        return out;
    }, { count: 0, errors: 0 });
}
async function build() {
    try {
        const settings = Elder_1.getElderConfig();
        const multiLine = settings.debug.build;
        if (cluster_1.default.isMaster) {
            const start = Date.now();
            let maxNumberOfWorkers = os_1.default.cpus().length;
            if (settings.build.numberOfWorkers < 0) {
                maxNumberOfWorkers = os_1.default.cpus().length + settings.build.numberOfWorkers;
            }
            else if (settings.build.numberOfWorkers > 0) {
                maxNumberOfWorkers = settings.build.numberOfWorkers;
            }
            if (process.env.ELDER_BUILD_NUMBER_OF_WORKERS &&
                Number(process.env.ELDER_BUILD_NUMBER_OF_WORKERS) > 0 &&
                !isNaN(Number(process.env.ELDER_BUILD_NUMBER_OF_WORKERS))) {
                maxNumberOfWorkers = Number(process.env.ELDER_BUILD_NUMBER_OF_WORKERS);
            }
            let numberOfWorkers = maxNumberOfWorkers;
            let markWorkersComplete;
            const workersComplete = new Promise((resolve) => {
                markWorkersComplete = resolve;
            });
            const errors = [];
            let timings = [];
            let multibar;
            let singlebar;
            if (multiLine) {
                multibar = new cli_progress_1.default.MultiBar({
                    clearOnComplete: false,
                    hideCursor: true,
                    forceRedraw: true,
                    format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | Errors: {errors} | Avg: {avgRequestTime} ',
                }, cli_progress_1.default.Presets.shades_grey);
            }
            else {
                singlebar = new cli_progress_1.default.SingleBar({
                    clearOnComplete: false,
                    hideCursor: true,
                    forceRedraw: true,
                    format: '[{bar}] {percentage}% | ETA: {eta}s | {value}/{total} | Errors: {errors} | P/sec: {pagesPerSecond} ',
                }, cli_progress_1.default.Presets.shades_classic);
            }
            let workersProcessing = 0;
            let barInterval;
            let totalRequests = Infinity;
            // eslint-disable-next-line no-inner-declarations
            function prepareWorkerMessageHandler(workerId) {
                return function messageHandler(msg) {
                    if (msg[0] === 'html') {
                        counts[workerId].count = msg[1];
                        counts[workerId].errCount = msg[2];
                        if (msg[4]) {
                            errors.push(msg[4]);
                        }
                    }
                    else if (msg[0] === 'done') {
                        timings = timings.concat(msg[1]);
                        workersProcessing -= 1;
                        const reduced = getWorkerCounts(counts);
                        if (workersProcessing === 0 && totalRequests === reduced.count) {
                            markWorkersComplete({ errors, timings });
                        }
                    }
                    else if (msg[0] === 'start') {
                        if (multiLine) {
                            counts[workerId].bar = multibar.create(msg[1], 0, {
                                avgRequestTime: 'Pending',
                                errors: 0,
                            });
                        }
                        workersProcessing += 1;
                        counts[workerId].startTime = Date.now();
                        if (numberOfWorkers === workersProcessing) {
                            barInterval = setInterval(() => {
                                if (multiLine) {
                                    Object.keys(counts).forEach((workerId) => {
                                        if (counts[workerId].bar) {
                                            counts[workerId].bar.update(counts[workerId].count, {
                                                errors: counts[workerId].errCount,
                                                avgRequestTime: `${Math.round(((Date.now() - counts[workerId].startTime) / counts[workerId].count) * 100) / 100}ms`,
                                            });
                                        }
                                    });
                                }
                                else {
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
            const mElder = new Elder_1.Elder({ context: 'build' });
            const mElderResults = await mElder.cluster();
            totalRequests = mElderResults.allRequests.length;
            let requestsToSplit = [...mElderResults.allRequests];
            if (settings.build.shuffleRequests) {
                requestsToSplit = shuffleArray_1.default(requestsToSplit);
            }
            let requestsPerWorker = Math.ceil(requestsToSplit.length / numberOfWorkers);
            if (requestsPerWorker < 100)
                requestsPerWorker = 100;
            numberOfWorkers = Math.ceil(totalRequests / requestsPerWorker);
            if (numberOfWorkers > maxNumberOfWorkers)
                numberOfWorkers = maxNumberOfWorkers;
            for (let i = 0; i < numberOfWorkers; i += 1) {
                cluster_1.default.fork();
            }
            const counts = {};
            if (!multiLine) {
                singlebar.start(requestsToSplit.length, 0, { pagesPerSecond: 0, errors: 0 });
            }
            for (const id in cluster_1.default.workers) {
                const workerId = `worker-${id}`;
                if (settings.debug.build) {
                    cluster_1.default.workers[id].on('exit', (code, signal) => {
                        if (signal) {
                            console.log(`worker-${id} was killed by signal: ${signal}`);
                        }
                        else if (code !== 0) {
                            console.log(`worker-${id} exited with error code: ${code}`);
                        }
                        else {
                            console.log(`worker-${id} successfully exited!`, code, signal);
                        }
                    });
                }
                const msgHandler = prepareWorkerMessageHandler(workerId);
                cluster_1.default.workers[id].on('message', msgHandler);
                const workerRequests = requestsToSplit.splice(0, requestsPerWorker);
                counts[workerId] = {
                    id,
                    count: 0,
                    errCount: 0,
                };
                cluster_1.default.workers[id].send({ cmd: 'start', workerRequests, id });
            }
            await workersComplete;
            clearInterval(barInterval);
            if (multiLine) {
                multibar.stop();
                // console.log(`Builds finished, shutting down workers`);
            }
            else {
                singlebar.stop();
            }
            for (const id in cluster_1.default.workers) {
                cluster_1.default.workers[id].kill();
            }
            const time = Date.now() - start;
            if (time > 60000) {
                console.log(`Build completed ${totalRequests} pages in ${Math.round((time / 60000) * 100) / 100} minutes`);
            }
            else if (time > 1000) {
                console.log(`Build completed ${totalRequests} pages in ${Math.round((time / 1000) * 100) / 100} seconds`);
            }
            else {
                console.log(`Build completed ${totalRequests} pages in ${time}ms`);
            }
            let success = true;
            mElder.errors = [...mElder.errors, ...errors];
            if (mElder.errors.length > 0) {
                await mElder.runHook('error', mElder);
                success = false;
            }
            await mElder.runHook('buildComplete', { success, ...mElder, timings });
            if (settings.debug.build) {
                console.log('Build complete. Workers:', cluster_1.default.workers);
            }
        }
        else {
            process.on('message', async (msg) => {
                if (msg.cmd === 'start') {
                    const wElder = new Elder_1.Elder({ context: 'build', worker: true });
                    const timings = await wElder.worker(msg.workerRequests);
                    process.send(['done', timings]);
                    setTimeout(() => {
                        process.kill(process.pid);
                    }, 2000);
                }
            });
        }
    }
    catch (e) {
        console.log(e);
    }
}
exports.default = build;
