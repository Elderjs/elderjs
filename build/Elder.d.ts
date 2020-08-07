import build from './build/build';
import partialHydration from './partialHydration/partialHydration';
import { getConfig } from './utils';
import { RoutesOptions } from './routes/types';
import { HookOptions } from './hooks/types';
import { ConfigOptions, SettingOptions, QueryOptions, RequestOptions, RequestsOptions } from './utils/types';
declare const getElderConfig: typeof getConfig;
declare class Elder {
    bootstrapComplete: Promise<any>;
    markBootstrapComplete: (Object: any) => void;
    settings: ConfigOptions & SettingOptions;
    routes: RoutesOptions;
    hooks: Array<HookOptions>;
    data: Object;
    runHook: (string: any, Object: any) => Promise<any>;
    hookInterface: any;
    customProps: any;
    query: QueryOptions;
    allRequests: Array<RequestOptions>;
    serverLookupObject: RequestsOptions;
    errors: any[];
    helpers: {};
    server: any;
    builder: any;
    constructor({ context, worker }: {
        context: any;
        worker?: boolean;
    });
    cluster(): Promise<any>;
    worker(workerRequests: any): Promise<any[]>;
    build(): any;
}
export { Elder, getElderConfig, build, partialHydration };
