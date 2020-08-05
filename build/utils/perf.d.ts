/**
 * A little helper around perf_hooks.
 * Returns an object with a start and end function.
 *
 * This allows you to pass in a page.perf.start('name') and then page.perf.end('name') and the result is stored in a timings array.
 *
 * @param {Object} page
 * @returns {Object}
 */
declare const perf: (page: any) => void;
export default perf;
