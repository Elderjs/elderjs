/* eslint-disable no-use-before-define */
import { TPerfPayload, TPerfTimings } from '../utils/perf';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { THookInterface } from './hookInterface';
import {
  TRequestObject,
  SettingsOptions,
  Stack,
  TErrors,
  TServerLookupObject,
  TUserHelpers,
  PluginOptions,
} from '../utils/types';
import { RouteOptions, RoutesObject } from '../routes/types';
import { ShortcodeDefs } from '../shortcodes/types';

export type THookName =
  | 'customizeHooks'
  | 'bootstrap'
  | 'allRequests'
  | 'middleware'
  | 'request'
  | 'data'
  | 'shortcodes'
  | 'stacks'
  | 'head'
  | 'compileHtml'
  | 'html'
  | 'requestComplete'
  | 'error'
  | 'buildComplete';

export type TRunHook = (hook: THookName, params: any) => Promise<any> | any | void;

interface IHookBase {
  hook: THookName;
  name: string;
  description: string;
  priority?: Number;
}

type TVoidOrUndefined = undefined | null | void | never;
type TGenericHookReturn<T> = TVoidOrUndefined | T | Promise<TVoidOrUndefined> | Promise<T>;

type TFilteredPlugin = Omit<PluginOptions, 'init' | 'shortcodes' | 'routes' | 'hooks'>;

export interface ICustomizeHooksHook extends IHookBase {
  hook: 'customizeHooks';
  run: (params: { perf: TPerfPayload; hookInterface: THookInterface; errors: TErrors }) => TGenericHookReturn<{
    hookInterface?: THookInterface;
    errors?: TErrors;
  }>;
}
export interface IBootstrapHook extends IHookBase {
  hook: 'bootstrap';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    errors: TErrors;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    routes: RoutesObject;
    hooks: TProcessedHooksArray;
    query: any;
  }) => TGenericHookReturn<{
    errors?: TErrors;
    helpers?: TUserHelpers;
    data?: any;
    settings?: SettingsOptions;
    query?: any;
  }>;
}

export interface IAllRequestsHook extends IHookBase {
  hook: 'allRequests';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    allRequests: TRequestObject[];
    routes: RoutesObject;
    query: any;
    errors: TErrors;
  }) => TGenericHookReturn<{ errors?: TErrors; allRequests?: any }>;
}

export interface IMiddlewareHook extends IHookBase {
  hook: 'middleware';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    errors: TErrors;
    query: any;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    allRequests: TRequestObject[];
    routes: RoutesObject;
    req: any;
    next: any;
    res: any;
    serverLookupObject: TServerLookupObject;
    runHook: TRunHook;
    shortcodes: ShortcodeDefs;
    request: TRequestObject;
    router: any;
  }) => TGenericHookReturn<{
    errors?: TErrors;
    query?: any;
    helpers?: TUserHelpers;
    data?: any;
    settings?: SettingsOptions;
    allRequests?: TRequestObject[];
    routes?: RoutesObject;
    req?: any;
    next?: any;
    res?: any;
    request?: TRequestObject;
    serverLookupObject?: TServerLookupObject;
  }>;
}

export interface IRequestHook extends IHookBase {
  hook: 'request';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: TRequestObject;
    allRequests: TRequestObject[];
    query: any;
    errors: TErrors;
    routes: RoutesObject;
    route: RouteOptions;
  }) => TGenericHookReturn<{
    errors?: TErrors;
    helpers?: TUserHelpers;
    data?: any;
    settings?: SettingsOptions;
    request?: TRequestObject;
    route?: RouteOptions;
  }>;
}

export interface IDataHook extends IHookBase {
  hook: 'data';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    data: any;
    request: TRequestObject;
    errors: TErrors;
    helpers: TUserHelpers;
    query: any;
    routes: RoutesObject;
    cssStack: Stack;
    headStack: Stack;
    beforeHydrateStack: Stack;
    hydrateStack: Stack;
    customJsStack: Stack;
    footerStack: Stack;
    settings: SettingsOptions;
    next: any;
  }) => TGenericHookReturn<{
    errors?: TErrors;
    data?: any;
    cssStack?: Stack;
    headStack?: Stack;
    beforeHydrateStack?: Stack;
    hydrateStack?: Stack;
    customJsStack?: Stack;
    footerStack?: Stack;
  }>;
}

export interface IShortcodeHook extends IHookBase {
  hook: 'shortcodes';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: TRequestObject;
    query: any;
    errors: TErrors;
    cssStack: Stack;
    headStack: Stack;
    customJsStack: Stack;
    layoutHtml: any;
    shortcodes: any;
    allRequests: TRequestObject[];
  }) => TGenericHookReturn<{
    errors?: TErrors;
    layoutHtml?: any;
    cssStack?: Stack;
    headStack?: Stack;
    customJsStack?: Stack;
  }>;
}

export interface IStacksHook extends IHookBase {
  hook: 'stacks';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: TRequestObject;
    query: any;
    errors: TErrors;
    cssStack: Stack;
    htmlAttributesStack: Stack;
    bodyAttributesStack: Stack;
    headStack: Stack;
    beforeHydrateStack: Stack;
    hydrateStack: Stack;
    customJsStack: Stack;
    footerStack: Stack;
  }) => TGenericHookReturn<{
    errors?: TErrors;
    cssStack?: Stack;
    htmlAttributesStack?: Stack;
    bodyAttributesStack?: Stack;
    headStack?: Stack;
    beforeHydrateStack?: Stack;
    hydrateStack?: Stack;
    customJsStack?: Stack;
    footerStack?: Stack;
  }>;
}

export interface IHeadHook extends IHookBase {
  hook: 'head';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: TRequestObject;
    headString: string;
    query: any;
    errors: TErrors;
  }) => TGenericHookReturn<{ errors?: TErrors; headString?: string }>;
}

export interface ICompileHtmlHook extends IHookBase {
  hook: 'compileHtml';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    htmlAttributesString: string;
    bodyAttributesString: string;
    request: TRequestObject;
    headString: string;
    footerString: string;
    layoutHtml: string;
    htmlString: string;
  }) => TGenericHookReturn<{ errors?: TErrors; htmlString?: string }>;
}

export interface IHtmlHook extends IHookBase {
  hook: 'html';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: TRequestObject;
    htmlString: string;
    query: any;
    errors: TErrors;
  }) => TGenericHookReturn<{ errors?: TErrors; htmlString?: string }>;
}

export interface IRequestCompleteHook extends IHookBase {
  hook: 'requestComplete';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    request: TRequestObject;
    htmlString: string;
    query: any;
    settings: SettingsOptions;
    errors: TErrors;
    timings: TPerfTimings;
    data: any;
  }) => TGenericHookReturn<{ errors?: any }>;
}

export interface IErrorHook extends IHookBase {
  hook: 'error';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: TRequestObject;
    query: any;
    errors: TErrors;
  }) => void | undefined | Promise<void> | Promise<undefined> | any | Promise<any>;
}

export interface IBuildCompleteHook extends IHookBase {
  hook: 'buildComplete';
  run: (params: {
    plugin?: TFilteredPlugin;
    perf: TPerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    timings: TPerfTimings[];
    query: any;
    errors: TErrors;
    routes: RoutesObject;
    allRequests: TRequestObject[];
  }) => void | undefined | Promise<void> | Promise<undefined> | any | Promise<any>;
}

export type THooks =
  | ICustomizeHooksHook
  | IBootstrapHook
  | IAllRequestsHook
  | IMiddlewareHook
  | IRequestHook
  | IDataHook
  | IShortcodeHook
  | IStacksHook
  | IHeadHook
  | ICompileHtmlHook
  | IHtmlHook
  | IRequestCompleteHook
  | IErrorHook
  | IBuildCompleteHook;

export type HooksArray = Array<THooks>;

export type ProcessedHook<T> = T & {
  priority: Number;
  $$meta: {
    type: string;
    addedBy: string;
  };
};

export type TProcessedHook =
  | ProcessedHook<ICustomizeHooksHook>
  | ProcessedHook<IBootstrapHook>
  | ProcessedHook<IAllRequestsHook>
  | ProcessedHook<IMiddlewareHook>
  | ProcessedHook<IRequestHook>
  | ProcessedHook<IDataHook>
  | ProcessedHook<IShortcodeHook>
  | ProcessedHook<IStacksHook>
  | ProcessedHook<IHeadHook>
  | ProcessedHook<ICompileHtmlHook>
  | ProcessedHook<IHtmlHook>
  | ProcessedHook<IRequestCompleteHook>
  | ProcessedHook<IErrorHook>
  | ProcessedHook<IBuildCompleteHook>;
export type TProcessedHooksArray = Array<TProcessedHook>;
