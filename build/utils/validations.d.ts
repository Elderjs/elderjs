import { ConfigOptions, PluginOptions } from './types';
import { RouteOptions } from '../routes/types';
import { HookOptions } from '../hooks/types';
declare function getDefaultConfig(): ConfigOptions;
declare function validateConfig(config?: {}): false | ConfigOptions;
declare function validateRoute(route: any, routeName: string): RouteOptions | false;
declare function validatePlugin(plugin: any): PluginOptions | false;
declare function validateHook(hook: any, allSupportedHooks: any): HookOptions | false;
export { validateRoute, validatePlugin, validateHook, validateConfig, getDefaultConfig };
