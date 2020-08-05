/**
 * Returns a object where the key is the SSR svelte compontent name and the value is the client svelte compontent file name with a hash.
 * This function is used to support cache busting with svelte compontents.
 *
 * @returns {Object}
 */
declare const getHashedSvelteCompontents: (config: any) => {};
export default getHashedSvelteCompontents;
