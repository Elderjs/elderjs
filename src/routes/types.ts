import { PerfPayload } from '../utils/perf';
import { AllRequests, SettingsOptions, TErrors, RequestObject, TUserHelpers } from '../utils/types';

interface Permalink {
  (input: { request: RequestObject; settings: SettingsOptions; helpers?: TUserHelpers }): string;
}

type MetaOptions = {
  type: string;
  addedBy: string;
  pattern?: RegExp;
  routeString?: string;
  keys?: string[];
};

export type DataFnPayload = {
  data: any;
  query: any;
  helpers: TUserHelpers;
  settings: SettingsOptions;
  request: RequestObject;
  errors: TErrors;
  perf: PerfPayload;
  allRequests: AllRequests;
  next: () => any;
};

export type DataFn = (payload: DataFnPayload) => PromiseLike<{ [key: string]: any }> | { [key: string]: any };

interface IBaseRouteOptions {
  template?: string;
  templateComponent?: (x: any) => string;
  layout?: string;
  layoutComponent?: (x: any) => string;
  data?: Object | DataFn;
  permalink: Permalink;
  all?:
    | any[]
    | ((payload: {
        settings: SettingsOptions;
        query: any;
        helpers: TUserHelpers;
        data: any;
        perf: PerfPayload;
      }) => [any] | Promise<any>);
  $$meta?: MetaOptions;
  name?: string;
  dynamic?: boolean;
}
export interface RouteOptions extends IBaseRouteOptions {
  [x: string]: any;
}

export interface ProcessedRouteOptions extends RouteOptions {
  template: string;
  templateComponent: (x: any) => string;
  layout: string;
  layoutComponent: (x: any) => string;
  data: Object | DataFn;
  permalink: Permalink;
  all:
    | any[]
    | ((payload: {
        settings: SettingsOptions;
        query: any;
        helpers: TUserHelpers;
        data: any;
        perf: PerfPayload;
      }) => [any] | Promise<any>);
  $$meta: MetaOptions;
  name: string;
  dynamic: boolean;
}

export type RoutesObject = Record<string, ProcessedRouteOptions>;
