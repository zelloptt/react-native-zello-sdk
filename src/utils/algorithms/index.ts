import { ZelloContact } from '../../types';
import { isString } from 'lodash';

export function sortedArrayFind<T>(
  array: readonly T[],
  item: any,
  comparator: (item: any, arrayElement: T) => number
): T | undefined {
  const i = lowerBound(array, item, comparator);
  if (i >= 0 && i < array.length && comparator(item, array[i]) === 0) {
    return array[i];
  }
  return undefined;
}

export function lowerBound<T>(
  array: readonly T[],
  item: any,
  comparator: (item: any, arrayElement: T) => number
): number {
  let index = binarySearch(array, item, comparator);
  // binarySearch returns the non-negative index of the item, or a negative index which is the -index - 1 where the item would be inserted
  if (index < 0) {
    index = -index - 1;
  }
  // Several identical objects may exist in the same collection; we need to find the first one
  if (index > 0 && index < array.length) {
    const foundObject = array[index];
    while (index > 0) {
      if (comparator(array[index - 1], foundObject) !== 0) {
        break;
      }
      --index;
    }
  }
  return index;
}

/**
 * Binary search algorithm adapted from https://stackoverflow.com/a/29018745.
 *
 * The array may contain duplicate items. If there are more than one equal items in the array,
 * the returned value can be the index of any one of the equal items.
 *
 * Time complexity: O(log n)
 * @param array A sorted array.
 * @param item An item to search for.
 * @param comparator A comparator function. The function takes two arguments: (a, b) and returns:
 *                a negative number if a is less than b;
 *                0 if a is equal to b;
 *                a positive number of a is greater than b.
 * @return The index of the item in a sorted array or (-n-1) where n is the insertion point for the new item.
 */
export function binarySearch<T>(
  array: readonly T[],
  item: any,
  comparator: (item: any, arrayElement: T) => number
): number {
  let m = 0;
  let n = array.length - 1;
  while (m <= n) {
    const k = (n + m) >> 1;
    const cmp = comparator(item, array[k]);
    if (cmp > 0) {
      m = k + 1;
    } else if (cmp < 0) {
      n = k - 1;
    } else {
      return k;
    }
  }
  return -m - 1;
}

export function compareNameAscending(
  a: ZelloContact | string,
  b: ZelloContact | string
): number {
  const alc = isString(a) ? a.toLowerCase() : a.name.toLowerCase();
  const blc = isString(b) ? b.toLowerCase() : b.name.toLowerCase();
  if (alc > blc) {
    return 1;
  }
  if (alc < blc) {
    return -1;
  }
  return 0;
}
