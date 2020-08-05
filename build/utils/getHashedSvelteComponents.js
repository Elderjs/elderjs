"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
let results = {};
let ready = false;
/**
 * Returns a object where the key is the SSR svelte compontent name and the value is the client svelte compontent file name with a hash.
 * This function is used to support cache busting with svelte compontents.
 *
 * @returns {Object}
 */
const getHashedSvelteCompontents = (config) => {
    if (!ready) {
        ready = true;
        const ssrFiles = glob_1.default.sync(path_1.default.resolve(process.cwd(), config.locations.svelte.ssrComponents) + '/*.js', {});
        const clientFiles = glob_1.default.sync(path_1.default.resolve(process.cwd(), config.locations.svelte.clientComponents) + '/*.js', {});
        // get an array with jus the file name before .js;
        // CityResults.js => CityResults
        const ssr = ssrFiles.map((s) => s.split('/').pop().split('.')[0]);
        const client = clientFiles.map((s) => s.split('/').pop().split('.')[0]);
        // match the SSR version (no hash) to a hashed version.
        // allowing the correct file name to be looked up by the SSR key.
        results = ssr.reduce((out, cv) => {
            const found = client.find((c) => c.includes(`entry${cv}`));
            if (found)
                out[cv] = found;
            return out;
        }, {});
        return results;
    }
    else {
        return results;
    }
};
exports.default = getHashedSvelteCompontents;
