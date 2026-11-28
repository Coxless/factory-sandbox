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
  if (normalized === "") {
    return 0;
  }
  return normalized.split(" ").filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

/**
 * 書記素クラスター（見た目の1文字）単位で文字数を数える。
 * @param {string} input
 * @returns {number}
 */
export function countChars(input) {
  const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
  return Array.from(segmenter.segment(input)).length;
}

/**
 * 文字列をコードポイント単位で指定の長さに切り詰める。
 * @param {string} input
 * @param {number} max
 * @returns {string}
 */
export function truncate(input, max) {
  if (max < 1) {
    throw new RangeError("max は 1 以上である必要があります");
  }
  const chars = [...input];
  if (chars.length <= max) {
    return input;
  }
  return chars.slice(0, max - 1).join("") + "…";
}
