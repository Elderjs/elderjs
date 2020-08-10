"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cosmiconfig_1 = require("cosmiconfig");
const lodash_defaultsdeep_1 = __importDefault(require("lodash.defaultsdeep"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const validations_1 = require("./validations");
const tsConfigExist_1 = require("./tsConfigExist");
function getConfig(context) {
    const explorerSync = cosmiconfig_1.cosmiconfigSync('elder');
    const explorerSearch = explorerSync.search();
    let loadedConfig = {};
    if (explorerSearch && explorerSearch.config) {
        loadedConfig = explorerSearch.config;
    }
    const defaultConfig = validations_1.getDefaultConfig();
    const config = lodash_defaultsdeep_1.default(loadedConfig, defaultConfig);
    if (config.debug.automagic && (!context || context !== 'build')) {
        console.log(`debug.automagic:: Your elder.config.js has debug.automagic = true. We call this chatty mode, but it is designed to show you the things we're doing automatically so you're aware. To turn it off set debug.automagic = 'false'`);
    }
    if (!config.typescript) {
        config.typescript = tsConfigExist_1.tsConfigExist();
    }
    if (config.typescript) {
        if (config.locations.buildFolder === '') {
            try {
                const tsConfigLocation = path_1.default.resolve(process.cwd(), './tsconfig.json');
                const tsConfig = JSON.parse(fs_1.default.readFileSync(tsConfigLocation, { encoding: 'utf-8' }));
                if (tsConfig.compilerOptions.outDir) {
                    if (!tsConfig.compilerOptions.outDir.includes('/')) {
                        config.locations.buildFolder = `./${tsConfig.compilerOptions.outDir}/`;
                        if (config.debug.automagic && (!context || context !== 'build')) {
                            console.log(`debug.automagic:: Automatically setting your location.buildFolder = "${config.locations.buildFolder} 'in your elder.config.js file as we detected it from your tsconfig.json`);
                        }
                    }
                    else if (config.debug.automagic && (!context || context !== 'build')) {
                        console.log(`debug.automagic:: Unable to automatically set your build folder from your tsconfig. Please add it to your elder.config.js. We saw ${tsConfig.compilerOptions.outDir} and didn't know how to parse it as we're still typescript newbies. Want to help us? We'd love a PR to make this more robust.`);
                    }
                }
            }
            catch (e) {
                if (config.debug.automagic && (!context || context !== 'build')) {
                    console.log(`debug.automagic:: Tried to read ./tsconfig.json to set srcDirectory in your elder.config.js file, but something went wrong. This often happens if there is a // in your file to comment out a setting. If you are using typescript and are building to a separate folder please define where your javascript files can be found  by defining 'locations.buildFolder'. Here is the error: `, e);
                }
            }
        }
    }
    return config;
}
exports.default = getConfig;
