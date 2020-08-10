"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginSchema = exports.routeSchema = exports.hookSchema = exports.configSchema = exports.getDefaultConfig = exports.validateConfig = exports.validateHook = exports.validatePlugin = exports.validateRoute = void 0;
const yup = __importStar(require("yup"));
const hookInterface_1 = __importDefault(require("../hookInterface/hookInterface"));
const configSchema = yup.object().shape({
    locations: yup
        .object()
        .shape({
        assets: yup
            .string()
            .notRequired()
            .default('./public/dist/static/')
            .label('Where your site\'s assets files should be written to if you are using the Elder.js template. (Include ./public/)"'),
        public: yup
            .string()
            .notRequired()
            .default('./public/')
            .label('Where should files be written? This represents the "root" of your site and where your html will be built.'),
        svelte: yup
            .object()
            .shape({
            ssrComponents: yup
                .string()
                .notRequired()
                .default('./___ELDER___/compiled/')
                .label('Location where should SSR components be stored.'),
            clientComponents: yup
                .string()
                .notRequired()
                .default('./public/dist/svelte/')
                .label('Location where Svelte components that are bundled for the client should be saved. (Include ./public/)'),
        })
            .notRequired(),
        systemJs: yup
            .string()
            .notRequired()
            .default('/dist/static/s.min.js')
            .label('If you are using the recommended Elder.js rollup file it is using Systemjs. This defines is where the systemjs file will be found on your site. (exclude /public/)'),
        srcFolder: yup
            .string()
            .notRequired()
            .default('./src/')
            .label('Elder.js and plugins use this to resolve where things should be in the expected file structure.'),
        buildFolder: yup
            .string()
            .notRequired()
            .default('')
            .label(`If Elder.js doesn't find the files it is looking for in the src folder, it will look in the build folder. (used for typescript)`),
        intersectionObserverPoly: yup
            .string()
            .notRequired()
            .default('/dist/static/intersection-observer.js')
            .label('Elder.js uses a poly fill for the intersection observer. This is where it will be found on your site. (exclude /public/)'),
    })
        .notRequired()
        .label('Where various files are written and read from.'),
    debug: yup
        .object()
        .shape({
        stacks: yup.boolean().notRequired().default(false).label('Outputs details of stack processing in the console.'),
        hooks: yup.boolean().notRequired().default(false).label('Output details of hook execution in the console.'),
        performance: yup
            .boolean()
            .notRequired()
            .default(false)
            .label('Outputs a detauled speed report on each pageload.'),
        build: yup.boolean().notRequired().default(false).label('Displays detailed build information for each worker.'),
        automagic: yup
            .boolean()
            .notRequired()
            .default(true)
            .label('Displays settings or actions that are automagically done to help with debugging..'),
    })
        .label('Offers various levels of debug logging.'),
    hooks: yup.object().shape({
        disable: yup
            .array()
            .of(yup.string())
            .notRequired()
            .default([])
            .label('This is an array of hooks to be excluded from execution. To be clear, this isn\'t the "hook" name found in the "hookInterface.ts" file but instead the name of the system, user, plugin, or route hook that is defined.  For instance if you wanted to by name to prevent the system hook that writes html to the public folder during builds from being run, you would add "internalWriteFile" to this array.'),
    }),
    server: yup.object().shape({
        prefix: yup.string().notRequired().default('').label(`If Elder.js should serve all pages with a prefix.`),
    }),
    build: yup.object().shape({
        numberOfWorkers: yup
            .number()
            .notRequired()
            .default(-1)
            .label(`This controls the number of worker processes spun up during build. It accepts negative numbers to represent the number of cpus minus the given number. Or the total number of processes to spin up. `),
        shuffleRequests: yup
            .boolean()
            .notRequired()
            .default(false)
            .label(`If you have some pages that take longer to generate than others, you may want to shuffle your requests so they are spread out more evenly across processes when building.`),
    }),
    typescript: yup.boolean().default(false).label('This causes Elder.js to look in the /build/ folder '),
});
exports.configSchema = configSchema;
const routeSchema = yup.object({
    template: yup.string().required(),
    all: yup
        .mixed()
        .required()
        .test('isFunction', 'all() should be a function or async function', (value) => typeof value === 'function' || (typeof value === 'object' && value.then === 'function')),
    permalink: yup
        .mixed()
        .required()
        .test('isFunction', 'Permalink should be a function or async function', (value) => typeof value === 'function' || (typeof value === 'object' && value.then === 'function')),
    hooks: yup.array().notRequired(),
});
exports.routeSchema = routeSchema;
const pluginSchema = yup.object({
    name: yup.string(),
    description: yup.string(),
    init: yup
        .mixed()
        .notRequired()
        .test('isFunction', 'Run should be a function or async function', (value) => typeof value === 'function' || (typeof value === 'object' && value.then === 'function')),
    routes: yup.mixed().notRequired(),
    hooks: yup.array().required(),
});
exports.pluginSchema = pluginSchema;
const hookSchema = yup
    .object({
    hook: yup
        .string()
        .required()
        .test('valid-hook', 'This is not a supported hook.', (value) => hookInterface_1.default.find((supportedHook) => supportedHook.hook === value)),
    name: yup.string().required(),
    description: yup.string().required(),
    priority: yup.number().positive().integer().max(100).optional().default(50),
    run: yup
        .mixed()
        .defined()
        .test('isFunction', 'Run should be a function or async function', (value) => typeof value === 'function' || (typeof value === 'object' && value.then === 'function')),
    $$meta: yup.object({
        type: yup.string().required(),
        addedBy: yup.string().required(),
    }),
})
    .noUnknown(true);
exports.hookSchema = hookSchema;
function getDefaultConfig() {
    const validated = configSchema.cast();
    return validated;
}
exports.getDefaultConfig = getDefaultConfig;
function validateConfig(config = {}) {
    try {
        configSchema.validateSync(config);
        const validated = configSchema.cast(config);
        return validated;
    }
    catch (err) {
        return false;
    }
}
exports.validateConfig = validateConfig;
function validateRoute(route, routeName) {
    try {
        routeSchema.validateSync(route);
        const validated = routeSchema.cast(route);
        return validated;
    }
    catch (err) {
        console.error(`Route "${routeName}" does not have the required fields and is disabled. Please let the author know`, err.errors, err.value);
        return false;
    }
}
exports.validateRoute = validateRoute;
function validatePlugin(plugin) {
    try {
        pluginSchema.validateSync(plugin);
        const validated = pluginSchema.cast(plugin);
        return validated;
    }
    catch (err) {
        console.error(`Plugin ${plugin.$$meta.addedBy} does not have the required fields. Please let the author know`, err.errors, err.value);
        return false;
    }
}
exports.validatePlugin = validatePlugin;
function validateHook(hook) {
    try {
        hookSchema.validateSync(hook);
        const validated = hookSchema.cast(hook);
        return validated;
    }
    catch (err) {
        if (hook && hook.$$meta && hook.$$meta.type === 'plugin') {
            console.error(`Plugin ${hook.$$meta.addedBy} uses a hook, but it is ignored due to error(s). Please create a ticket with that plugin so the author can investigate it.`, err.errors, err.value);
        }
        else {
            console.error(`Hook ignored due to error(s).`, err.errors, err.value);
        }
        return false;
    }
}
exports.validateHook = validateHook;
