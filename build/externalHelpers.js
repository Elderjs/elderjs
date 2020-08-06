"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let userHelpers;
const cache = {};
async function helpers({ settings, query, helpers }) {
    const srcFolder = path_1.default.join(process.cwd(), settings.locations.srcFolder);
    const buildFolder = path_1.default.join(process.cwd(), settings.locations.buildFolder);
    const helperFilePath = `helpers/index.js`;
    const srcHelpers = path_1.default.join(srcFolder, helperFilePath);
    const buildHelpers = path_1.default.join(buildFolder, helperFilePath);
    if (!cache[helperFilePath]) {
        try {
            fs_1.default.statSync(srcHelpers);
            userHelpers = require(srcHelpers);
            if (typeof userHelpers === 'function') {
                userHelpers = await userHelpers({ settings, query, helpers });
            }
            cache[helperFilePath] = userHelpers;
        }
        catch (err) {
            if (settings.locations.buildFolder && settings.locations.buildFolder.length > 0) {
                try {
                    fs_1.default.statSync(buildHelpers);
                    userHelpers = require(buildHelpers);
                    if (typeof userHelpers === 'function') {
                        userHelpers = await userHelpers({ settings, query, helpers });
                    }
                    cache[helperFilePath] = userHelpers;
                }
                catch (e) { }
            }
            if (err.code === 'ENOENT') {
                if (settings.debug.automagic) {
                    console.log(`debug.automagic:: We attempted to automatically add in helpers, but we couldn't find the file at ${srcHelpers}.`);
                }
            }
        }
    }
    else {
        userHelpers = cache[helperFilePath];
    }
    if (userHelpers && Object.keys(userHelpers).length > 0) {
        if (settings.debug.automagic) {
            console.log(`debug.automagic:: We're add in helpers to the helpers object from the file at: ${helperFilePath}.`);
        }
    }
    return userHelpers;
}
exports.default = helpers;
