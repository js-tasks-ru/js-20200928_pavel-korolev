/**
 * uniq - returns array of uniq values:
 * @param {*[]} arr - the array of primitive values
 * @returns {*[]} - the new array with uniq values
 */

/**
 * "читерский" вариант через Set =)
 *
 * export function uniq(arr = []) {
 *  return [...new Set(arr)];
 * }
*/

export function uniq(arr = []) {
  return Object
    .values(
      arr.reduce((cache, value, index) => {
        if (!cache.hasOwnProperty(value)) {
          cache[value] = { index, value };
        }

        return cache;
      }, {})
    )
    .sort((a, b) => a.index - b.index)
    .map(({ value }) => value);
}
