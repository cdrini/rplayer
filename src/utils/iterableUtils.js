/**
 * @template T
 * @param {Array<T>} arr
 * @returns {Generator<T>}
 */
export function* rev(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    yield arr[i];
  }
}

/**
 * @template T
 * @param {Iterable<T>} gen
 * @param {number} size
 * @returns {Generator<T[]>}
 */
export function* slidingWindow(gen, size) {
  const window = [];
  for (const el of gen) {
    window.push(el);
    if (window.length >= size) {
      yield window;
      window.shift();
    }
  }
  if (window.length < size) {
    yield window;
  }
}
