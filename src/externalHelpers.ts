/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import path from 'path';
import fs from 'fs';

import { ExternalHelperRequestOptions } from './utils/types';

let userHelpers;

let cache;

async function externalHelpers({ settings, query, helpers }: ExternalHelperRequestOptions) {
  const srcHelpers = path.join(settings.srcDir, 'helpers');
  if (!cache) {
    if (fs.existsSync(`${srcHelpers}${path.sep}index.js`) || fs.existsSync(`${srcHelpers}${path.sep}index.ts`)) {
      userHelpers = require(srcHelpers);

      if (typeof userHelpers === 'function') {
        userHelpers = await userHelpers({ settings, query, helpers });
      }
      cache = userHelpers;
    } else if (settings.debug.automagic) {
      console.log(
        `debug.automagic:: We attempted to automatically add in helpers, but we couldn't find the file at ${srcHelpers}.`,
      );
    }
  } else {
    userHelpers = cache;
  }

  return userHelpers;
}

export default externalHelpers;
