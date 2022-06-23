import path from 'path';
import fs from 'fs-extra';

import { QueryOptions, SettingsOptions, THelpers } from './utils/types.js';

let userHelpers;

let cache;

async function externalHelpers({
  settings,
  query,
  helpers,
}: {
  settings: SettingsOptions;
  query: QueryOptions;
  helpers: THelpers;
}) {
  const srcHelpers = path.join(settings.srcDir, 'helpers/index.js');
  try {
    if (!cache) {
      if (fs.existsSync(srcHelpers)) {
        try {
          const reqHelpers = await import(srcHelpers);
          userHelpers = reqHelpers.default || reqHelpers;

          if (typeof userHelpers === 'function') {
            userHelpers = await userHelpers({ settings, query, helpers });
          }

          if (userHelpers.default) {
            userHelpers = userHelpers.default;
          }

          cache = userHelpers;
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      userHelpers = cache;
    }
  } catch (e) {
    console.error(`Error importing ${srcHelpers}`);
    console.error(e);
  }

  return userHelpers;
}

export default externalHelpers;
