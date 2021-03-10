/**
 * Helper function to allow permalinks to be referenced by obj.routeName.
 * It also handles adding of the /dev prefix when settings.server is true.
 *
 * @param {Object} { routes, settings = {} }
 * @returns {Object} This object allows for referencing permalinks as obj.routeName()
 */
const permalinks = ({ routes, settings }) =>
  Object.keys(routes).reduce((out, cv) => {
    // eslint-disable-next-line no-param-reassign
    out[cv] = (data) => routes[cv].permalink({ request: data, settings });
    return out;
  }, {});

export default permalinks;
