/**
 * 1 つ以上の連続した空白文字に一致する。
 */
const WHITESPACE_RUN = /\s+/g;

/**
 * 1 文字以上の文字または数字に一致する（Unicode の書記素カテゴリを使用）。
 */
const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

/**
 * 文字列の前後の空白を取り、連続する空白を1つにまとめる。
 * @param {string} input
 * @returns {string}
 */
export function normalizeSpaces(input) {
  return input.trim().replace(WHITESPACE_RUN, " ");
}

/**
 * 行数を数える。\n と \r\n を改行として扱い、空文字列は 0、末尾の改行は数えない。
 * @param {string} input
 * @returns {number}
 */
export function countLines(input) {
  if (input === "") {
    return 0;
  }
  const lines = input.split(/\r?\n/);
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.length;
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
  return normalized.split(" ").filter((token) => LETTER_OR_NUMBER.test(token)).length;
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
