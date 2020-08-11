"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseBuildPerf(timings) {
    const counts = {};
    timings.forEach((request) => {
        request.forEach((timing) => {
            if (typeof counts[timing.name] !== 'object') {
                counts[timing.name] = {
                    sum: 0,
                    count: 0,
                };
            }
            counts[timing.name].sum += timing.duration;
            counts[timing.name].count += 1;
        });
    });
    return Object.keys(counts)
        .map((key) => [key.split('.'), counts[key]])
        .sort((a, b) => a[0].length - b[0].length)
        .reduce((out, cv) => {
        const [root, subkey, detail, more] = cv[0];
        const { sum, count } = cv[1];
        if (root && subkey && detail && more) {
            if (!out[root])
                out[root] = {};
            if (typeof out[root] === 'number') {
                out[root] = {
                    avg: out[root],
                };
            }
            if (!out[root][subkey])
                out[root][subkey] = {};
            if (typeof out[root][subkey] === 'number') {
                out[root][subkey] = {
                    avg: out[root][subkey],
                };
            }
            if (!out[root][subkey][detail])
                out[root][subkey][detail] = {};
            if (typeof out[root][subkey][detail] === 'number') {
                out[root][subkey][detail] = {
                    avg: out[root][subkey][detail],
                };
            }
            out[root][subkey][detail][more] = Math.round((sum / count) * 1000) / 1000;
        }
        else if (root && subkey && detail) {
            if (!out[root])
                out[root] = {};
            if (typeof out[root] === 'number') {
                out[root] = {
                    avg: out[root],
                };
            }
            if (!out[root][subkey])
                out[root][subkey] = {};
            if (typeof out[root][subkey] === 'number') {
                out[root][subkey] = {
                    avg: out[root][subkey],
                };
            }
            out[root][subkey][detail] = Math.round((sum / count) * 1000) / 1000;
        }
        else if (root && subkey) {
            if (!out[root])
                out[root] = {};
            if (typeof out[root] === 'number') {
                out[root] = {
                    avg: out[root],
                };
            }
            out[root][subkey] = Math.round((sum / count) * 1000) / 1000;
        }
        else if (root) {
            if (!out[root])
                out[root] = Math.round((sum / count) * 1000) / 100;
        }
        return out;
    }, {});
}
exports.default = parseBuildPerf;
