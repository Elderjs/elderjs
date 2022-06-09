import { PluginOptions } from '@babel/core';
import { TPerfPayload } from '../utils/perf';
import { AllRequests, SettingsOptions, RequestObject, TUserHelpers } from '../utils/types';

export interface ShortcodeResponse {
  html?: string;
  css?: string;
  js?: string;
  head?: string;
}

export interface ShortcodeDefinition {
  shortcode: string;
  run: (payload: {
    perf: TPerfPayload;
    props: Record<string, string>;
    content?: string;
    plugin?: PluginOptions;
    data: any;
    query: any;
    request: RequestObject;
    helpers: TUserHelpers;
    settings: SettingsOptions;
    allRequests: AllRequests;
  }) => string | Promise<string> | ShortcodeResponse | Promise<ShortcodeResponse>;
  plugin?: PluginOptions; // reference to the plugin closure scope.
  $$meta?: {
    addedBy: string;
    type: string;
  };
}

export type ShortcodeDefinitions = Array<ShortcodeDefinition>;
