/* eslint-disable no-use-before-define */
import type { UnprocessedRoutesObject } from '../routes/types';
import type { HooksArray } from '../hooks/types';
import type { ShortcodeDefinitions } from '../shortcodes/types';
import { SettingsOptions } from '../utils/types';

export type PluginInitPayload = PluginOptions & {
  settings: SettingsOptions;
  config: PluginConfig;
};
interface PluginInit {
  (input: PluginInitPayload): PromiseLike<PluginOptions> | PluginOptions;
}

export type PluginConfig = {
  [x: string]: any;
};

export type PluginOptions = {
  name: `@elderjs/plugin-${string}` | `elderjs-plugin-${string}`;
  description: string;
  init: PluginInit;
  routes?: UnprocessedRoutesObject;
  hooks: HooksArray;
  config?: PluginConfig;
  shortcodes?: ShortcodeDefinitions;
  minimumElderjsVersion?: `${string}.${string}.${string}`;

  [x: string]: any;
};

export type PluginClosure = Omit<PluginOptions, 'init' | 'shortcodes' | 'routes' | 'hooks'>;
