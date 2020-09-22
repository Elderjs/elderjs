/* istanbul ignore file */
export { configSchema, hookSchema, routeSchema, pluginSchema, shortcodeSchema } from './utils/validations';
export { Elder, build, partialHydration } from './Elder';
export * from './utils/types';
export * from './utils/index';
export * from './routes/routes';
export * from './hookInterface/types';
export { hookInterface } from './hookInterface/hookInterface';
export { hookEntityDefinitions } from './hookInterface/hookEntityDefinitions';

export { default as getElderConfig } from './utils/getConfig';
