import type { HookOptions } from '../hookInterface/types';
export declare type RouteOptions = {
    template?: string;
    templateComponent?: (string: any) => Object;
    layout?: string | ((string: any) => Object);
    data?: Object | (() => Object);
    permalink: Permalink | any;
    parent?: string;
    breadcrumbLabel?: string | (() => string);
    all?: [string] | ((Object: any) => [string] | Promise<any>);
    sitemap?: SiteMap;
    lastUpdate?: any;
    hooks?: Array<HookOptions>;
    criticalCssRequests?: Array<CriticalCssRequest>;
    $$meta?: MetaOptions;
};
export declare type RoutesOptions = {
    [name: string]: RouteOptions;
};
declare type CriticalCssRequest = {
    slug: string;
    random?: number;
    state?: StateSlug;
};
export declare type StateSlug = {
    slug: string;
    id: Number;
};
declare type SiteMap = {
    priority: number;
    changefreq: string;
};
declare type MetaOptions = {
    type: string;
    addedBy: string;
};
interface Permalink {
    (input?: Object): string;
}
export {};
