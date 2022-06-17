/* eslint-disable no-use-before-define */
import { PerfPayload, PerfTimings } from '../utils/perf.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { THookInterface } from './hookInterface.js';
import {
  RequestObject,
  SettingsOptions,
  Stack,
  TErrors,
  ServerLookupObject,
  TUserHelpers,
  AllRequests,
} from '../utils/types';

import { RouteOptions, ProcessedRoutesObject } from '../routes/types.js';
import { ShortcodeDefinitions } from '../shortcodes/types.js';
import { PluginClosure } from '../plugins/types.js';

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
  priority?: number;
}

type TVoidOrUndefined = undefined | null | void | never;
type TGenericHookReturn<T> = TVoidOrUndefined | T | Promise<TVoidOrUndefined> | Promise<T>;

export interface ICustomizeHooksHook extends IHookBase {
  hook: 'customizeHooks';
  run: (params: { perf: PerfPayload; hookInterface: THookInterface; errors: TErrors }) => TGenericHookReturn<{
    plugin?: PluginClosure;
    hookInterface?: THookInterface;
    errors?: TErrors;
  }>;
}
export interface IBootstrapHook extends IHookBase {
  hook: 'bootstrap';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    errors: TErrors;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    routes: ProcessedRoutesObject;
    hooks: ProcessedHooksArray;
    query: any;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
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
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    allRequests: AllRequests;
    routes: ProcessedRoutesObject;
    query: any;
    errors: TErrors;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
    errors?: TErrors;
    allRequests?: any;
  }>;
}

export interface IMiddlewareHook extends IHookBase {
  hook: 'middleware';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    errors: TErrors;
    query: any;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    allRequests: AllRequests;
    routes: ProcessedRoutesObject;
    req: any;
    next: any;
    res: any;
    serverLookupObject: ServerLookupObject;
    runHook: TRunHook;
    shortcodes: ShortcodeDefinitions;
    request: RequestObject;
    router: any;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
    errors?: TErrors;
    query?: any;
    helpers?: TUserHelpers;
    data?: any;
    settings?: SettingsOptions;
    allRequests?: AllRequests;
    routes?: ProcessedRoutesObject;
    req?: any;
    next?: any;
    res?: any;
    request?: RequestObject;
    serverLookupObject?: ServerLookupObject;
  }>;
}

export interface IRequestHook extends IHookBase {
  hook: 'request';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: RequestObject;
    allRequests: AllRequests;
    query: any;
    errors: TErrors;
    routes: ProcessedRoutesObject;
    route: RouteOptions;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
    errors?: TErrors;
    helpers?: TUserHelpers;
    data?: any;
    settings?: SettingsOptions;
    request?: RequestObject;
    route?: RouteOptions;
  }>;
}

export interface IDataHook extends IHookBase {
  hook: 'data';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    data: any;
    request: RequestObject;
    errors: TErrors;
    helpers: TUserHelpers;
    query: any;
    routes: ProcessedRoutesObject;
    cssStack: Stack;
    headStack: Stack;
    beforeHydrateStack: Stack;
    hydrateStack: Stack;
    customJsStack: Stack;
    footerStack: Stack;
    settings: SettingsOptions;
    next: any;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
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
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: RequestObject;
    query: any;
    errors: TErrors;
    cssStack: Stack;
    headStack: Stack;
    customJsStack: Stack;
    layoutHtml: any;
    shortcodes: any;
    allRequests: AllRequests;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
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
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: RequestObject;
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
    plugin?: PluginClosure;
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
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: RequestObject;
    headString: string;
    query: any;
    errors: TErrors;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
    errors?: TErrors;
    headString?: string;
  }>;
}

export interface ICompileHtmlHook extends IHookBase {
  hook: 'compileHtml';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    htmlAttributesString: string;
    bodyAttributesString: string;
    request: RequestObject;
    headString: string;
    footerString: string;
    layoutHtml: string;
    htmlString: string;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
    errors?: TErrors;
    htmlString?: string;
  }>;
}

export interface IHtmlHook extends IHookBase {
  hook: 'html';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: RequestObject;
    htmlString: string;
    query: any;
    errors: TErrors;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
    errors?: TErrors;
    htmlString?: string;
  }>;
}

export interface IRequestCompleteHook extends IHookBase {
  hook: 'requestComplete';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    request: RequestObject;
    htmlString: string;
    query: any;
    settings: SettingsOptions;
    errors: TErrors;
    timings: PerfTimings;
    data: any;
  }) => TGenericHookReturn<{
    plugin?: PluginClosure;
    errors?: any;
  }>;
}

export interface IErrorHook extends IHookBase {
  hook: 'error';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    request: RequestObject;
    query: any;
    errors: TErrors;
  }) => void | undefined | Promise<void> | Promise<undefined> | any | Promise<any>;
}

export interface IBuildCompleteHook extends IHookBase {
  hook: 'buildComplete';
  run: (params: {
    plugin?: PluginClosure;
    perf: PerfPayload;
    helpers: TUserHelpers;
    data: any;
    settings: SettingsOptions;
    timings: PerfTimings[];
    query: any;
    errors: TErrors;
    routes: ProcessedRoutesObject;
    allRequests: AllRequests;
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
  priority: number;
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
export type ProcessedHooksArray = Array<TProcessedHook>;
