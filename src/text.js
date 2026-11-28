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
 * @example
 * normalizeSpaces("  a   b\tc \n"); // => "a b c"
 * @example
 * normalizeSpaces("a　　b"); // => "a b"
 */
export function normalizeSpaces(input) {
  return input.trim().replace(WHITESPACE_RUN, " ");
}

/**
 * 行数を数える。\n と \r\n を改行として扱い、空文字列は 0、末尾の改行は数えない。
 * @param {string} input
 * @returns {number}
 * @example
 * countLines("a\nb\nc"); // => 3
 * @example
 * countLines("a\r\nb\n"); // => 2
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
 * 空白文字で分割し、空の要素を除いた文字列配列を返す。
 * @param {string} input
 * @returns {string[]}
 * @example
 * splitWords("hello  world"); // => ["hello", "world"]
 * @example
 * splitWords("  a \t b \n "); // => ["a", "b"]
 */
export function splitWords(input) {
  return input.split(/\s+/).filter((token) => token !== "");
}

/**
 * 単語の数を数える（空白区切り）。
 * @param {string} input
 * @returns {number}
 * @example
 * countWords("hello  world"); // => 2
 * @example
 * countWords("a 、 b"); // => 2
 */
export function countWords(input) {
  const normalized = normalizeSpaces(input);
  return splitWords(normalized).filter((token) => LETTER_OR_NUMBER.test(token)).length;
}

/**
 * 書記素クラスター（見た目の1文字）単位で文字列を分割する Segmenter。
 * 日本語ロケール、grapheme 粒度で1つだけ生成して使い回す。
 */
const SEGMENTER = new Intl.Segmenter("ja", { granularity: "grapheme" });

/**
 * 書記素クラスター（見た目の1文字）単位で文字数を数える。
 * @param {string} input
 * @returns {number}
 * @example
 * countChars("日本語"); // => 3
 * @example
 * countChars("👨‍👩‍👧‍👦"); // => 1
 */
export function countChars(input) {
  return Array.from(SEGMENTER.segment(input)).length;
}

/**
 * テキスト統計を返す。
 * 単語数は記号だけの語を除く空白区切りの非空トークン数、文字数は書記素クラスター数、バイト数は UTF-8 のバイト数。
 * @param {string} input
 * @returns {{ words: number, chars: number, bytes: number }}
 */
export function getStats(input) {
  const words = countWords(input);
  const chars = countChars(input);
  const bytes = Buffer.byteLength(input, "utf8");
  return { words, chars, bytes };
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
