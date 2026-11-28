import assert from "node:assert/strict";
import { test } from "node:test";
import { countWords, normalizeSpaces, truncate } from "./text.js";

test("normalizeSpaces は前後の空白を取り、連続する空白を1つにする", () => {
  assert.equal(normalizeSpaces("  a   b\tc \n"), "a b c");
});

test("normalizeSpaces は前後の空白を取る", () => {
  assert.equal(normalizeSpaces("  a b  "), "a b");
});

test("normalizeSpaces はタブや改行を含む連続した空白を1つの半角スペースにまとめる", () => {
  assert.equal(normalizeSpaces("a\t\t\nb"), "a b");
});

test("normalizeSpaces は空白だけの文字列を空文字列にする", () => {
  assert.equal(normalizeSpaces("   \t\n  "), "");
});

test("normalizeSpaces は全角スペースを半角スペース 1 つにまとめる", () => {
  assert.equal(normalizeSpaces("a　　b"), "a b");
});

test("normalizeSpaces は \\r\\n を含む空白を半角スペース 1 つにまとめる", () => {
  assert.equal(normalizeSpaces("a\r\nb"), "a b");
  assert.equal(normalizeSpaces("a  \r\n  b"), "a b");
});

test("normalizeSpaces は前後の全角スペースを取る", () => {
  assert.equal(normalizeSpaces("　a b　"), "a b");
});

test("countWords は空白区切りの単語を数える", () => {
  assert.equal(countWords("hello  world"), 2);
  assert.equal(countWords("   "), 0);
});

test("空文字列は 0 単語", () => {
  assert.equal(countWords(""), 0);
});

test("全角スペースで区切られた「りんご　みかん」は 2 単語", () => {
  assert.equal(countWords("りんご　みかん"), 2);
});

test("countWords は改行で区切られた 3 語を数える", () => {
  assert.equal(countWords("one\ntwo\nthree"), 3);
});

test("countWords はタブで区切られた 2 語を数える", () => {
  assert.equal(countWords("one\ttwo"), 2);
});

test("countWords は改行とタブと空白が混在した文字列を数える", () => {
  assert.equal(countWords("one \t two \n three"), 3);
});

test("countWords は記号だけの語を数えない", () => {
  assert.equal(countWords("a 、 b"), 2);
  assert.equal(countWords("こんにちは 。"), 1);
  assert.equal(countWords("- - -"), 0);
});

test("truncate は短い文字列をそのまま返す", () => {
  assert.equal(truncate("hello", 10), "hello");
});

test("truncate は長い ASCII 文字列を切り詰める", () => {
  assert.equal(truncate("hello world", 8), "hello w…");
});

test("truncate はちょうど max の長さの文字列をそのまま返す", () => {
  assert.equal(truncate("hello", 5), "hello");
});

test("truncate は max=1 のとき '…' を返す", () => {
  assert.equal(truncate("hello", 1), "…");
});

test("truncate は max が 1 未満のとき RangeError を投げる", () => {
  assert.throws(() => truncate("hello", 0), RangeError);
  assert.throws(() => truncate("hello", -1), RangeError);
});

test("truncate は絵文字をコードポイント単位で切り詰める", () => {
  assert.equal(truncate("👨‍👩‍👧‍👦家族", 5), "👨‍👩‍…");
  assert.equal(truncate("🎉", 2), "🎉");
  assert.equal(truncate("🎉🎊🎁", 2), "🎉…");
});

test("truncate は日本語を正しく切り詰める", () => {
  assert.equal(truncate("こんにちは世界", 7), "こんにちは世界");
  assert.equal(truncate("こんにちは世界", 6), "こんにちは…");
  assert.equal(truncate("日本語", 4), "日本語");
});
