import glob from 'glob';

let results = {};

let ready = false;

/**
 * Returns a object where the key is the SSR svelte compontent name and the value is the client svelte compontent file name with a hash.
 * This function is used to support cache busting with svelte compontents.
 *
 * @returns {Object}
 */
const getHashedSvelteComponents = ({ ssrComponents, clientComponents }) => {
  if (!ready) {
    ready = true;

    const ssrFiles = glob.sync(`${ssrComponents}/*.js`, {});
    const clientFiles = glob.sync(`${clientComponents}/*.js`, {});

    // get an array with jus the file name before .js;
    // CityResults.js => CityResults
    const ssr = ssrFiles.map((s) => s.split('/').pop().split('.')[0]);

    const client = clientFiles.map((s) => s.split('/').pop().split('.')[0]);

    // match the SSR version (no hash) to a hashed version.
    // allowing the correct file name to be looked up by the SSR key.
    results = ssr.reduce((out, cv) => {
      const found = client.find((c) => c.includes(`entry${cv}`));
      if (found) out[cv] = found;
      return out;
    }, {});

    return results;
  }
  return results;
};

export default getHashedSvelteComponents;
