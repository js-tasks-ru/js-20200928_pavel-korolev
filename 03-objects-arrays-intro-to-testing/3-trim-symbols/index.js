/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === 0) {
    return '';
  }

  if (!size) {
    return string;
  }

  let pointer = 0;

  return string.split('').reduce((acc, char) => {
    const count = acc.slice(pointer).split(char).length;
    const prev = acc.charAt(acc.length - 1);

    if (prev && char !== prev) {
      pointer = acc.length;
    }

    return count > size ? acc : `${acc}${char}`;
  }, '');
}
