/**
 * Helper function that makes sure the array is indeed processed async.
 *
 * @async
 * @param {*} array
 * @param {*} callback
 */
declare function asyncForEach(array: any, callback: any): Promise<void>;
export default asyncForEach;
