/**
 * Helper function to allow permalinks to be referenced by obj.routeName.
 * It also handles adding of the /dev prefix when settings.server is true.
 *
 * @param {Object} { routes, settings = {} }
 * @returns {Object} This object allows for referncing permalinks as obj.routeName()
 */
declare const permalinks: ({ routes, settings }: {
    routes: any;
    settings: any;
}) => {};
export default permalinks;
