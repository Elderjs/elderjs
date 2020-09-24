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
    const systemJsClientFiles = glob.sync(`${clientComponents}/*.js`, {});
    const mjsClientFiles = glob.sync(`${clientComponents}/*.mjs`, {});

    // get an array with jus the file name before .js;
    // CityResults.js => CityResults
    const ssr = ssrFiles.map((s) => s.split('/').pop().split('.')[0]);

    const systemClient = systemJsClientFiles.map((s) => s.split('/').pop().split('.')[0]);
    console.log(mjsClientFiles);
    const mjsClient = mjsClientFiles.map((s) => s.split('/').pop().split('.')[0]);

    // match the SSR version (no hash) to a hashed version.
    // allowing the correct file name to be looked up by the SSR key.
    results = ssr.reduce((out, cv) => {
      if (typeof out[cv] !== 'object') out[cv] = {};
      const system = systemClient.find((c) => c.includes(`entry${cv}`));
      if (system) out[cv].system = system;
      const mjs = mjsClient.find((c) => c.includes(`entry${cv}`));
      if (mjsClient) out[cv].mjs = mjs;
      return out;
    }, {});

    return results;
  }
  return results;
};

export default getHashedSvelteComponents;
