/* istanbul ignore file */
export { configSchema, hookSchema, routeSchema, pluginSchema, shortcodeSchema } from './utils/validations';
export { Elder, build, partialHydration } from './Elder';
export * from './utils/types';
export * from './utils/index';
export * from './routes/routes';
export * from './hooks/types';
export { hookInterface } from './hooks/hookInterface';
export { hookEntityDefinitions } from './hooks/hookEntityDefinitions';

export { default as getElderConfig } from './utils/getConfig';
