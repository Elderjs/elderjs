import { TPerfPayload } from '../utils/perf';
import { SettingsOptions, TErrors, TRequestObject, TUserHelpers } from '../utils/types';

interface Permalink {
  (input: { request: TRequestObject; settings: SettingsOptions; helpers?: TUserHelpers }): string;
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
  request: TRequestObject;
  errors: TErrors;
  perf: TPerfPayload;
  allRequests: TRequestObject[];
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
        perf: TPerfPayload;
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
        perf: TPerfPayload;
      }) => [any] | Promise<any>);
  $$meta: MetaOptions;
  name: string;
  dynamic: boolean;
}

export type RoutesObject = Record<string, ProcessedRouteOptions>;
