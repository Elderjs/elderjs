"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const glob_1 = __importDefault(require("glob"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
function routes(settings) {
    if (settings.debug.automagic)
        console.log(`debug.automagic::
--------- routes.ts -----------
    `);
    const srcFolder = path_1.default.join(process.cwd(), settings.locations.srcFolder);
    const buildFolder = path_1.default.join(process.cwd(), settings.locations.buildFolder);
    let files = glob_1.default.sync(`${srcFolder}/routes/*/+(*.js|*.svelte)`);
    if (settings.locations.buildFolder && settings.locations.buildFolder.length > 0) {
        files = [...files, ...glob_1.default.sync(`${buildFolder}/routes/*/+(*.js|*.svelte)`)];
    }
    const ssrFolder = path_1.default.resolve(process.cwd(), settings.locations.svelte.ssrComponents);
    const ssrComponents = glob_1.default.sync(`${ssrFolder}/*.js`);
    const routejsFiles = files.filter((f) => f.endsWith('/route.js'));
    const output = routejsFiles.reduce((out, cv) => {
        const routeName = cv.replace('/route.js', '').split('/').pop();
        const capitalizedRoute = utils_1.capitalizeFirstLetter(routeName);
        // we need to look in the /build/ folder for all /src/ when it is typescript
        const route = settings.typescript ? require(cv).default : require(cv);
        const filesForThisRoute = files
            .filter((r) => r.includes(`/routes/${routeName}`))
            .filter((r) => !r.includes('route.js'));
        if (!route.permalink && (typeof route.permalink !== 'string' || typeof route.permalink !== 'function')) {
            throw new Error(`${cv} does not include a permalink attribute that is a string or function,`);
        }
        if (!route.all && (Array.isArray(route.all) || typeof route.all !== 'function')) {
            throw new Error(`${cv} does not include a all attribute that is is a function or an array.`);
        }
        if (route.template) {
            if (typeof route.template === 'string') {
                const componentName = route.template.replace('.svelte', '');
                const ssrComponent = ssrComponents.find((f) => f.endsWith(`${componentName}.js`));
                if (!ssrComponent) {
                    console.error(`We see you want to load ${route.template}, but we don't see a compiled template in ${settings.locations.svelte.ssrComponents}. You'll probably see more errors in a second. Make sure you've run rollup.`);
                }
                route.templateComponent = utils_1.svelteComponent(componentName);
            }
        }
        else {
            const svelteFile = filesForThisRoute.find((f) => f.endsWith(`${capitalizedRoute}.svelte`));
            if (settings.debug.automagic) {
                console.log(`debug.automagic:: No template defined for /routes/${routeName}/ looking for ${capitalizedRoute}.svelte`);
            }
            if (svelteFile) {
                if (settings.debug.automagic)
                    console.log(`debug.automagic:: Found ${capitalizedRoute}.svelte. Sweet, we'll set it up.`);
                route.template = `${capitalizedRoute}.svelte`;
                route.templateComponent = utils_1.svelteComponent(svelteFile);
                const ssrComponent = ssrComponents.find((f) => f.endsWith(`${capitalizedRoute}.js`));
                if (!ssrComponent) {
                    console.error(`We see you want to load ${route.template}, but we don't see a compiled template in ${settings.locations.svelte.ssrComponents}. You'll probably see more errors in a second. Make sure you've run rollup.`);
                }
            }
            else {
                if (settings.debug.automagic)
                    console.log(`debug.automagic:: Couldn't find  /routes/${routeName}/${capitalizedRoute}.svelte. Looking for a compiled svelte template in case you're using typescript or have your templates defined outside of your routes.`);
                const compiledSvelteFile = ssrComponents.find((f) => f.endsWith(`${capitalizedRoute}.js`));
                if (compiledSvelteFile) {
                    if (settings.debug.automagic)
                        console.log(`debug.automagic:: Sweet found a compiled component at ${ssrFolder}/${capitalizedRoute}.js, you're good to go.`);
                    route.template = `${capitalizedRoute}.svelte`;
                    route.templateComponent = utils_1.svelteComponent(compiledSvelteFile);
                }
            }
        }
        if (!route.data) {
            const dataFile = filesForThisRoute.find((f) => f.endsWith(`data.js`));
            if (dataFile) {
                route.data = settings.typescript ? require(dataFile).default : require(dataFile);
                if (settings.debug.automagic) {
                    console.log(`debug.automagic:: Loading your /routes/${routeName}/data.js file. It will be run and the object returned will be passed to your ${route.template} `);
                }
            }
            else {
                route.data = (page) => {
                    page.data = {};
                };
                if (settings.debug.automagic) {
                    console.warn(`debug.automagic:: We couldn't find a data file at /routes/${routeName}/data.js. This route won't receive any data props.`);
                }
            }
        }
        if (route.layout) {
            if (typeof route.layout === 'string' && route.layout.endsWith('.svelte')) {
                route.layout = utils_1.svelteComponent(route.layout.replace('.svelte', ''));
            }
        }
        else {
            if (settings.debug.automagic) {
                console.log(`debug.automagic:: The route at /routes/${routeName}/route.js doesn't have a layout specified so going to look for a Layout.svelte file.`);
            }
            route.layout = utils_1.svelteComponent('Layout.svelte');
        }
        // console.log(route);
        out[routeName] = route;
        return out;
    }, {});
    if (settings.debug.automagic) {
        console.log(`debug.automagic::
--------- end routes.ts -----------
  `);
    }
    return output;
}
exports.default = routes;
