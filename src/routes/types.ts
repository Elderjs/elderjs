import type { THooksArray } from '../hooks/types';
import { SettingsOptions, TRequestObject, TUserHelpers } from '../utils/types';

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

interface IBaseRouteOptions {
  template?: string;
  templateComponent?: (string) => Object;
  layout?: string;
  layoutComponent?: (string) => Object;
  data?: Object | (() => Object);
  permalink: Permalink;
  all?: any[] | ((payload: any) => [any] | Promise<any>);
  $$meta?: MetaOptions;
  name: string;
  hooks?: Array<THooksArray>;
  dynamic?: boolean;
}
export interface RouteOptions extends IBaseRouteOptions {
  [x: string]: any;
}

export type RoutesObject = Record<string, RouteOptions>;
