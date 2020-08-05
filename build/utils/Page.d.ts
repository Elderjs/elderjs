import { QueryOptions, SettingOptions, ConfigOptions, RequestOptions } from './types';
import { RoutesOptions } from '../routes/types';
declare class Page {
    uid: string;
    runHook: (string: any, Object: any) => Promise<any>;
    allRequests: Array<RequestOptions>;
    request: RequestOptions;
    settings: ConfigOptions & SettingOptions;
    helpers: {};
    data: Object;
    route: any;
    query: QueryOptions;
    errors: any[];
    routes: RoutesOptions;
    processStack: any;
    perf: any;
    customProps: any;
    htmlString: string;
    constructor({ request, settings, query, helpers, data, route, runHook, allRequests, routes, errors, customProps, }: {
        request: any;
        settings: any;
        query: any;
        helpers: any;
        data: any;
        route: any;
        runHook: any;
        allRequests: any;
        routes: any;
        errors: any;
        customProps?: {};
    });
    build(): Promise<any>;
    html(): string | Promise<any>;
}
export default Page;
