/**
 * 文字列の前後の空白を取り、連続する空白を1つにまとめる。
 * @param {string} input
 * @returns {string}
 */
export function normalizeSpaces(input) {
  return input.trim().replace(/\s+/g, " ");
}

/**
 * 単語の数を数える（空白区切り）。
 * @param {string} input
 * @returns {number}
 */
export function countWords(input) {
  const normalized = normalizeSpaces(input);
  return normalized === "" ? 0 : normalized.split(" ").length;
}
