import type { RoutesObject } from '../routes/types.js';
import type { HooksArray } from '../hooks/types.js';
import type { ShortcodeDefinitions } from '../shortcodes/types.js';
import { SettingsOptions } from '../utils/types.js';

export type PluginInitPayload = PluginOptions & {
  settings: SettingsOptions;
  config: PluginConfig;
};
interface PluginInit {
  (input: PluginInitPayload): PromiseLike<PluginOptions> | PluginOptions;
}

export type PluginConfig = {
  [x: string]: unknown;
};

export type PluginOptions = {
  name: `@elderjs/plugin-${string}` | `elderjs-plugin-${string}`;
  description: string;
  init: PluginInit;
  routes?: RoutesObject;
  hooks: HooksArray;
  config?: PluginConfig;
  shortcodes?: ShortcodeDefinitions;
  minimumElderjsVersion?: `${string}.${string}.${string}`;

  [x: string]: unknown;
};

export type PluginClosure = Omit<PluginOptions, 'init' | 'shortcodes' | 'routes' | 'hooks'>;
