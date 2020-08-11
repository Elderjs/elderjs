import type { StateSlug, RoutesOptions } from '../routes/types';
import type { HookOptions } from '../hookInterface/types';
export declare type ConfigOptions = {
    server: ServerOptions;
    build: BuildOptions;
    locations: LocationOptions;
    debug: DebugOptions;
    plugins?: any;
    hooks: {
        disable?: string[];
    };
    typescript: boolean;
    worker: boolean;
};
declare type ServerOptions = {
    prefix: string;
};
declare type BuildOptions = {
    numberOfWorkers: number;
    shuffleRequests: boolean;
};
declare type LocationOptions = {
    assets: string;
    public: string;
    svelte: SvelteOptions;
    systemJs: string;
    intersectionObserverPoly: string;
    srcFolder: string;
    buildFolder: string;
};
declare type SvelteOptions = {
    ssrComponents: string;
    clientComponents: string;
};
declare type DebugOptions = {
    stacks: boolean;
    hooks: boolean;
    performance: boolean;
    build: boolean;
    automagic: boolean;
};
export declare type SettingOptions = {
    server: boolean;
    build: boolean;
    $$internal: Internal;
};
declare type Internal = {
    hashedComponents: {};
};
export declare type QueryOptions = {
    db?: any;
};
export declare type ExternalHelperRequestOptions = {
    helpers: [];
    query: QueryOptions;
    settings: ConfigOptions & SettingOptions;
};
export declare type RequestOptions = {
    slug: string;
    random: number;
    state: StateSlug;
    uid: string;
    route: string;
    type: string;
    permalink: string;
};
export declare type RequestsOptions = {
    [name: string]: RequestOptions;
};
export interface BuildResult {
    timings: Array<Timing[]>;
    errors: any[];
}
export interface Timing {
    name: string;
    duration: number;
}
export declare type Stack = Array<StackItem>;
export declare type StackItem = {
    source: string;
    string: string;
    priority: number;
    name: string;
};
export declare type PluginOptions = {
    name: string;
    description: string;
    init: Init | any;
    routes?: RoutesOptions;
    hooks: Array<HookOptions>;
    config?: Object;
};
interface Init {
    (input: any): any;
}
export declare type ExcludesFalse = <T>(x: T | false) => x is T;
export {};
