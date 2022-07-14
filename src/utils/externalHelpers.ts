import path from 'path';
import fs from 'fs-extra';

import { QueryOptions, SettingsOptions, Helpers } from './types.js';

let userHelpers;

let cache;
let cacheReloadHash;

async function externalHelpers({
  settings,
  query,
  helpers,
}: {
  settings: SettingsOptions;
  query: QueryOptions;
  helpers: Helpers;
}) {
  const srcHelpers = path.join(settings.srcDir, `helpers/index.js`);
  try {
    if (cache && cacheReloadHash === settings.$$internal.reloadHash) {
      userHelpers = cache;
    } else {
      if (fs.existsSync(srcHelpers)) {
        try {
          const reqHelpers = await import(`${srcHelpers}?hash=${settings.$$internal.reloadHash}`);
          userHelpers = reqHelpers.default || reqHelpers;
          userHelpers = userHelpers.default || userHelpers;

          if (typeof userHelpers === 'function') {
            userHelpers = await userHelpers({ settings, query, helpers });
          }

          if (userHelpers.default) {
            userHelpers = userHelpers.default;
          }

          cacheReloadHash = settings.$$internal.reloadHash;
          cache = userHelpers;
        } catch (err) {
          console.error(err);
        }
      }
    }
  } catch (e) {
    console.error(`Error importing ${srcHelpers}`);
    console.error(e);
  }

  return userHelpers;
}

export default externalHelpers;
