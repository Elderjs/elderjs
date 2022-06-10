import { ProcessedRoutesObject } from '../routes/types.js';
import { SettingsOptions } from './types.js';

export type TPermalinks<T> = {
  [key in keyof T]: (data: any) => string;
};

/**
 * Helper function to allow permalinks to be referenced by obj.routeName.
 * It also handles adding of the /dev prefix when settings.server is true.
 */
const permalinks = ({ routes, settings }: { routes: ProcessedRoutesObject; settings: SettingsOptions }) =>
  Object.keys(routes).reduce((out, cv) => {
    // eslint-disable-next-line no-param-reassign
    out[cv] = (data) => routes[cv].permalink({ request: data, settings });
    return out;
  }, {} as TPermalinks<typeof routes>);

export default permalinks;
