"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.partialHydration = exports.build = exports.getElderConfig = exports.Elder = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_defaultsdeep_1 = __importDefault(require("lodash.defaultsdeep"));
const routes_1 = __importDefault(require("./routes/routes"));
const hookInterface_1 = require("./hookInterface/hookInterface");
const hooks_1 = __importDefault(require("./hooks"));
const build_1 = __importDefault(require("./build/build"));
exports.build = build_1.default;
const partialHydration_1 = __importDefault(require("./partialHydration/partialHydration"));
exports.partialHydration = partialHydration_1.default;
const utils_1 = require("./utils");
const createReadOnlyProxy_1 = require("./utils/createReadOnlyProxy");
const getElderConfig = utils_1.getConfig;
exports.getElderConfig = getElderConfig;
async function workerBuild({ bootstrapComplete, workerRequests }) {
    const { settings, query, helpers, data, runHook, routes, errors, customProps } = await bootstrapComplete;
    // potential issue that since builds are split across processes,
    // some plugins may need all requests of the same category to be passed at the same time.
    process.send(['start', workerRequests.length]);
    let i = 0;
    let errs = 0;
    const bTimes = [];
    const bErrors = [];
    await utils_1.asyncForEach(workerRequests, async (request) => {
        const page = new utils_1.Page({
            allRequests: workerRequests,
            request,
            settings,
            query,
            helpers,
            data,
            route: routes[request.route],
            runHook,
            routes,
            errors,
            customProps,
        });
        const { errors: buildErrors, timings } = await page.build();
        i += 1;
        bTimes.push(timings);
        const response = ['html', i];
        if (buildErrors && buildErrors.length > 0) {
            errs += 1;
            response.push(errs);
            response.push({ request, errors: buildErrors });
            bErrors.push({ request, errors: buildErrors });
        }
        else {
            response.push(errs);
        }
        process.send(response);
    });
    return bTimes;
}
class Elder {
    constructor({ context, worker = false }) {
        this.bootstrapComplete = new Promise((resolve) => {
            this.markBootstrapComplete = resolve;
        });
        const config = utils_1.getConfig(context);
        const { srcFolder, buildFolder } = config.locations;
        this.settings = {
            ...config,
            server: context === 'server' && config[context],
            build: context === 'build' && config[context],
            $$internal: {
                hashedComponents: utils_1.getHashedSvelteComponents(config),
            },
        };
        if (context === 'build' && worker) {
            this.settings.worker = worker;
        }
        if (!context || context === 'build') {
            this.settings.debug.automagic = false;
        }
        /**
         * Plugin initalization
         * * Collect plugin routes
         * * Add plugin object and helpers to all plugin hook functions.
         */
        let pluginRoutes = {};
        const pluginHooks = [];
        for (const pluginName in this.settings.plugins) {
            if (Object.hasOwnProperty.call(this.settings.plugins, pluginName)) {
                const pluginConfigFromConfig = this.settings.plugins[pluginName];
                let plugin;
                const pluginPath = `./plugins/${pluginName}/index.js`;
                const srcPlugin = path_1.default.resolve(process.cwd(), srcFolder, pluginPath);
                if (fs_extra_1.default.existsSync(srcPlugin)) {
                    plugin = require(srcPlugin).default || require(srcPlugin);
                }
                if (!plugin && buildFolder.length > 0) {
                    const buildPlugin = path_1.default.resolve(process.cwd(), buildFolder, pluginPath);
                    if (fs_extra_1.default.existsSync(buildPlugin)) {
                        plugin = require(buildPlugin).default || require(buildPlugin);
                    }
                }
                if (!plugin) {
                    // TODO: Test this functionality!
                    const pkgPath = path_1.default.resolve(process.cwd(), './node_modules/', pluginName, './index.js');
                    if (fs_extra_1.default.existsSync(pkgPath)) {
                        const pluginPackageJson = require(path_1.default.resolve(pkgPath, './package.json'));
                        const pluginPath = path_1.default.resolve(pkgPath, pluginPackageJson.main);
                        plugin = require(pluginPath).default || require(pluginPath);
                    }
                }
                if (!plugin) {
                    throw new Error(`Plugin ${pluginName} not found in plugins or node_modules folder.`);
                }
                plugin =
                    plugin.init({
                        ...plugin,
                        config: lodash_defaultsdeep_1.default(pluginConfigFromConfig, plugin.config),
                        settings: createReadOnlyProxy_1.createReadOnlyProxy(this.settings, 'Settings', 'plugin init()'),
                    }) || plugin;
                const validatedPlugin = utils_1.validatePlugin(plugin);
                if (!validatedPlugin)
                    return;
                plugin = validatedPlugin;
                // clean props the plugin shouldn't be able to change between hook... specifically their hooks;
                let { hooks: pluginHooksArray } = plugin;
                const { init, ...sanitizedPlugin } = plugin;
                pluginHooksArray = pluginHooksArray.map((hook) => {
                    return {
                        ...hook,
                        $$meta: {
                            type: 'plugin',
                            addedBy: pluginName,
                        },
                        run: async (payload = {}) => {
                            // pass the plugin definition into the closure of every hook.
                            let pluginDefinition = sanitizedPlugin;
                            // TODO: In a future release add in specific helpers to allow plugins to implement the
                            // same hook signature as we use on plugin.helpers; Plugin defined hooks will basically "shadow"
                            // system hooks.
                            payload.plugin = pluginDefinition;
                            const pluginResp = await hook.run(payload);
                            if (pluginResp) {
                                if (pluginResp.plugin) {
                                    const { plugin, ...rest } = pluginResp;
                                    // while objects are pass by reference, the pattern we encourage is to return the mutation of state.
                                    // if users followed this pattern for plugins, we may not be mutating the plugin definition, so this is added.
                                    pluginDefinition = plugin;
                                    return rest;
                                }
                                return pluginResp;
                            }
                            // return the hook's result.
                            return {};
                        },
                    };
                });
                pluginHooksArray.forEach((hook) => {
                    const validatedHook = utils_1.validateHook(hook, hookInterface_1.hookInterface);
                    if (validatedHook) {
                        pluginHooks.push(validatedHook);
                    }
                });
                if (Object.hasOwnProperty.call(plugin, 'routes')) {
                    for (const routeName in plugin.routes) {
                        // don't allow plugins to add hooks via the routes definitions like users can.
                        if (plugin.routes[routeName].hooks)
                            console.error(`WARN: Plugin ${routeName} is trying to register a hooks via a the 'hooks' array on a route. This is not supported. Plugins must define the 'hooks' array at the plugin level.`);
                        if (!plugin.routes[routeName].data) {
                            plugin.routes[routeName].data = () => ({});
                        }
                        if (typeof plugin.routes[routeName].template === 'string' &&
                            plugin.routes[routeName].template.endsWith('.svelte')) {
                            const templateName = plugin.routes[routeName].template.replace('.svelte', '');
                            const ssrComponent = path_1.default.resolve(process.cwd(), this.settings.locations.svelte.ssrComponents, `${templateName}.js`);
                            if (!fs_extra_1.default.existsSync(ssrComponent)) {
                                console.warn(`Plugin Route: ${routeName} has an error. No SSR svelte compontent found ${templateName} which was added by ${pluginName}. This may cause unexpected outcomes. If you believe this should be working, make sure rollup has run before this file is initialized. If the issue persists, please contact the plugin author. Expected location \`${ssrComponent}\``);
                            }
                            plugin.routes[routeName].templateComponent = utils_1.svelteComponent(templateName);
                        }
                        const { hooks: pluginRouteHooks, ...sanitizedRouteDeets } = plugin.routes[routeName];
                        const sanitizedRoute = {};
                        sanitizedRoute[routeName] = { ...sanitizedRouteDeets, $$meta: { type: 'plugin', addedBy: pluginName } };
                        pluginRoutes = { ...pluginRoutes, ...sanitizedRoute };
                    }
                }
            }
        }
        // add meta to routes and collect hooks from routes
        const userRoutesJsFile = routes_1.default(this.settings);
        const routeHooks = [];
        for (const routeName in userRoutesJsFile) {
            if (Object.hasOwnProperty.call(userRoutesJsFile, routeName)) {
                userRoutesJsFile[routeName] = {
                    ...userRoutesJsFile[routeName],
                    $$meta: {
                        type: 'route',
                        addedBy: 'routejs',
                    },
                };
                const processedRoute = userRoutesJsFile[routeName];
                if (processedRoute.hooks && Array.isArray(processedRoute.hooks)) {
                    processedRoute.hooks.forEach((hook) => {
                        const hookWithMeta = {
                            ...hook,
                            $$meta: {
                                type: 'route',
                                addedBy: routeName,
                            },
                        };
                        routeHooks.push(hookWithMeta);
                    });
                }
            }
        }
        // plugins should never overwrite user routes.
        const collectedRoutes = { ...pluginRoutes, ...userRoutesJsFile };
        const validatedRoutes = {};
        for (const collectedRouteName in collectedRoutes) {
            if ({}.hasOwnProperty.call(collectedRoutes, collectedRouteName)) {
                const collectedRoute = collectedRoutes[collectedRouteName];
                const validated = utils_1.validateRoute(collectedRoute, collectedRouteName);
                if (validated) {
                    validatedRoutes[collectedRouteName] = validated;
                }
            }
        }
        this.routes = validatedRoutes;
        let hooksJs = [];
        const hookSrcPath = path_1.default.resolve(process.cwd(), srcFolder, './hooks.js');
        const hookBuildPath = path_1.default.resolve(process.cwd(), buildFolder, './hooks.js');
        if (this.settings.debug.automagic) {
            console.log(`debug.automagic::Attempting to automagically pull in hooks from your ${hookSrcPath} ${buildFolder ? `with a fallback to ${hookBuildPath}` : ''}`);
        }
        try {
            const hookSrcFile = config.typescript ? require(hookSrcPath).default : require(hookSrcPath);
            hooksJs = hookSrcFile.map((hook) => ({
                ...hook,
                $$meta: {
                    type: 'hooks.js',
                    addedBy: 'hooks.js',
                },
            }));
        }
        catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                if (buildFolder && buildFolder.length > 0) {
                    try {
                        const hookBuildFile = config.typescript
                            ? require(hookBuildPath).default
                            : require(hookBuildPath);
                        hooksJs = hookBuildFile.map((hook) => ({
                            ...hook,
                            $$meta: {
                                type: 'hooks.js',
                                addedBy: 'hooks.js',
                            },
                        }));
                    }
                    catch (err2) {
                        if (err2.code !== 'MODULE_NOT_FOUND') {
                            console.error(err);
                        }
                    }
                }
                else if (this.settings.debug.automagic) {
                    console.log(`No luck finding that hooks file. You can add one at ${hookSrcPath}`);
                }
            }
            else {
                console.error(err);
            }
        }
        const elderJsHooks = hooks_1.default.map((hook) => ({
            ...hook,
            $$meta: {
                type: 'internal',
                addedBy: 'elder.js',
            },
        }));
        const allSupportedHooks = hookInterface_1.hookInterface;
        this.hooks = [...elderJsHooks, ...pluginHooks, ...routeHooks, ...hooksJs]
            .map((hook) => utils_1.validateHook(hook, hookInterface_1.hookInterface))
            .filter(Boolean);
        if (this.settings.hooks.disable && this.settings.hooks.disable.length > 0) {
            this.hooks = this.hooks.filter((h) => !this.settings.hooks.disable.includes(h.name));
        }
        // todo, plugins should be able to register their own hooks?
        this.data = {};
        this.hookInterface = allSupportedHooks;
        this.customProps = {};
        this.query = {};
        this.allRequests = [];
        this.serverLookupObject = {};
        this.errors = [];
        this.helpers = {
            permalinks: utils_1.permalinks({ routes: this.routes, settings: this.settings }),
            svelteComponent: utils_1.svelteComponent,
        };
        if (context === 'server') {
            this.server = utils_1.prepareServer({ bootstrapComplete: this.bootstrapComplete });
        }
        // customizeHooks should not be used by plugins. Plugins should use their own closure to manage data and be side effect free.
        const hooksMinusPlugins = this.hooks.filter((h) => h.$$meta.type !== 'plugin');
        this.runHook = utils_1.prepareRunHook({
            hooks: hooksMinusPlugins,
            allSupportedHooks: this.hookInterface,
            settings: this.settings,
        });
        this.runHook('customizeHooks', this).then(async () => {
            // we now have customProps and a new hookInterface.
            this.runHook = utils_1.prepareRunHook({
                hooks: this.hooks,
                allSupportedHooks: this.hookInterface,
                settings: this.settings,
            });
            await this.runHook('bootstrap', this);
            // collect all of our requests
            await utils_1.asyncForEach(Object.keys(this.routes), async (routeName) => {
                const route = this.routes[routeName];
                let allRequestsForRoute = [];
                if (typeof route.all === 'function') {
                    allRequestsForRoute = await route.all({
                        settings: this.settings,
                        query: this.query,
                        helpers: this.helpers,
                        data: this.data,
                    });
                }
                else if (Array.isArray(route.all)) {
                    allRequestsForRoute = route.all;
                }
                if (!Array.isArray(allRequestsForRoute)) {
                    throw new Error(`${routeName}'s all() function isn't returning an array`);
                }
                allRequestsForRoute.forEach((r) => {
                    r.route = routeName;
                    if (!{}.hasOwnProperty.call(r, 'slug')) {
                        throw new Error(`Request for ${routeName} is missing a slug property.`);
                    }
                });
                this.allRequests = this.allRequests.concat(allRequestsForRoute);
            });
            await this.runHook('allRequests', this);
            await utils_1.asyncForEach(this.allRequests, async (request) => {
                if (!this.routes[request.route] || !this.routes[request.route].permalink)
                    console.log(request);
                request.type = context === 'server' ? 'server' : context === 'build' ? 'build' : 'unknown';
                request.permalink = await this.routes[request.route].permalink({
                    request,
                    settings: { ...this.settings },
                });
                if (this.settings && this.settings.server && this.settings.server.prefix) {
                    request.permalink = this.settings.server.prefix + request.permalink;
                }
                if (context === 'server') {
                    this.serverLookupObject[request.permalink] = request;
                }
            });
            if (this.allRequests.length !== new Set(this.allRequests.map((r) => r.permalink)).size) {
                // useful error logging for when there are duplicate permalinks.
                for (let i = 0, l = this.allRequests.length; i < l; i += 1) {
                    for (let ii = 0, li = this.allRequests.length; ii < li; ii += 1) {
                        if (i !== ii && this.allRequests[i].permalink === this.allRequests[ii].permalink) {
                            throw new Error(`Duplicate permalinks detected. Here are the relevant requests: ${JSON.stringify(this.allRequests[i])} and ${JSON.stringify(this.allRequests[ii])}`);
                        }
                    }
                }
            }
            this.markBootstrapComplete(this);
        });
    }
    cluster() {
        return this.bootstrapComplete;
    }
    worker(workerRequests) {
        return workerBuild({ bootstrapComplete: this.bootstrapComplete, workerRequests });
    }
    build() {
        return this.builder;
    }
}
exports.Elder = Elder;
