/**
 * Helper function that makes sure the array is indeed processed async.
 *
 * @async
 * @param {*} array
 * @param {*} callback
 */
async function asyncForEach(array, callback) {
  let index = 0;
  const ar = array.length;
  for (; index < ar; index++) {
    await callback(array[index], index, array);
  }
}
export default asyncForEach;
