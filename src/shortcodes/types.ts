import { PluginClosure } from '../plugins/types';
import { PerfPayload } from '../utils/perf';
import { AllRequests, SettingsOptions, RequestObject, TUserHelpers } from '../utils/types';

interface FullShortcodeResponse {
  html?: string;
  css?: string;
  js?: string;
  head?: string;
}

export type ShortcodeResponse = FullShortcodeResponse | string | Promise<FullShortcodeResponse> | Promise<string>;

export interface ShortcodeDefinition {
  shortcode: string;
  run: (payload: {
    perf: PerfPayload;
    props: Record<string, string>;
    content?: string;
    plugin?: PluginClosure;
    data: any;
    query: any;
    request: RequestObject;
    helpers: TUserHelpers;
    settings: SettingsOptions;
    allRequests: AllRequests;
  }) => ShortcodeResponse;
  plugin?: PluginClosure; // reference to the plugin closure scope.
  $$meta?: {
    addedBy: string;
    type: string;
  };
}

export type ShortcodeDefinitions = Array<ShortcodeDefinition>;
