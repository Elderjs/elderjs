import glob from 'glob';
import path from 'path';

let results = {};

let ready = false;

const globBasenames = (pattern) => {
  const filenames = glob.sync(pattern);
  const extension = path.extname(pattern);
  return filenames.map((filename) => path.basename(filename, extension));
};

/**
 * Returns a object where the key is the SSR svelte compontent name and the value is the client svelte compontent file name with a hash.
 * This function is used to support cache busting with svelte compontents.
 *
 * @returns {Object}
 */
const getHashedSvelteComponents = ({ srcDir, $$internal: { ssrComponents, clientComponents } }) => {
  if (!ready) {
    ready = true;

    const hydrateableComponents = [
      ...globBasenames(`${srcDir}/components/*.svelte`),
      ...globBasenames(`${srcDir}/components/**/*.svelte`),
    ];

    // get an array with jus the file name before .js;
    // CityResults.js => CityResults
    const ssr = globBasenames(`${ssrComponents}/*/*.js`);
    const iifes = globBasenames(`${clientComponents}/*.js`);
    const mjss = globBasenames(`${clientComponents}/*.mjs`);

    // match the SSR version (no hash) to a hashed version.
    // allowing the correct file name to be looked up by the SSR key.

    const missing = [];
    results = ssr.reduce((out, cv) => {
      if (typeof out[cv] !== 'object') out[cv] = {};
      out[cv].iife = iifes.find((c) => c.includes(`iife${cv}`));
      out[cv].mjs = mjss.find((c) => c.includes(`entry${cv}`));

      if (!out[cv].mjs && hydrateableComponents.includes(cv)) {
        missing.push(cv);
      }

      return out;
    }, {});

    if (missing.length > 0) {
      throw new Error(
        `Browser component not found for (${JSON.stringify(
          missing,
        )}). Race condition present.  Make sure Rollup has completed.`,
      );
    }

    return results;
  }
  return results;
};

export default getHashedSvelteComponents;
