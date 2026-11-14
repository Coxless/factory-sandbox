import assert from "node:assert/strict";
import { test } from "node:test";
import { countWords, normalizeSpaces } from "./text.js";

test("normalizeSpaces は前後の空白を取り、連続する空白を1つにする", () => {
  assert.equal(normalizeSpaces("  a   b\tc \n"), "a b c");
});

test("countWords は空白区切りの単語を数える", () => {
  assert.equal(countWords("hello  world"), 2);
  assert.equal(countWords("   "), 0);
});
