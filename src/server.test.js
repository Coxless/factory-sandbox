import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "./server.js";

/** @type {import("node:http").Server} */
let server;
/** @type {string} */
let base;

before(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  const address = /** @type {import("node:net").AddressInfo} */ (server.address());
  base = `http://127.0.0.1:${address.port}`;
});

after(() => new Promise((resolve) => server.close(() => resolve(undefined))));

/**
 * @param {string} path
 * @param {number} [expectedStatus]
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
async function request(path, expectedStatus = 200, options) {
  const res = await fetch(`${base}${path}`, options);
  assert.equal(res.status, expectedStatus);
  return res;
}

test("/healthz は 200 と status: ok を返す", async () => {
  const res = await request("/healthz");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("/ は HTML を返す", async () => {
  const res = await request("/");
  assert.equal(res.headers.get("content-type"), "text/html; charset=utf-8");
  assert.match(await res.text(), /factory-sandbox/);
});

test("知らないパスは 404", async () => {
  await request("/nope", 404);
});

test("HEAD /healthz は 200 で本文なし", async () => {
  const res = await request("/healthz", 200, { method: "HEAD" });
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(await res.text(), "");
});

test("HEAD /nope は 404 で本文なし", async () => {
  const res = await request("/nope", 404, { method: "HEAD" });
  assert.equal(await res.text(), "");
});

test("POST /healthz は 405 method not allowed", async () => {
  const res = await request("/healthz", 405, { method: "POST" });
  assert.equal(await res.text(), "method not allowed\n");
  assert.equal(res.headers.get("allow"), "GET, HEAD");
});

test("DELETE /api/words は 405", async () => {
  await request("/api/words", 405, { method: "DELETE" });
});

test("GET /api/words?text=hello%20world は単語数と行数を返す", async () => {
  const res = await request("/api/words?text=hello%20world");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { text: "hello world", words: 2, lines: 1 });
});

test("GET /api/words?text=日本語の全角スペース区切りも数える", async () => {
  const res = await request(`/api/words?text=${encodeURIComponent("こんにちは　世界")}`);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { text: "こんにちは　世界", words: 2, lines: 1 });
});

test("GET /api/words で text がないときは 400", async () => {
  const res = await request("/api/words", 400);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { error: "text is required" });
});

test("GET /api/words?text= は空文字列なので 400", async () => {
  const res = await request("/api/words?text=", 400);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { error: "text is required" });
});

test("GET /api/words?text=hello%0Aworld は改行で lines: 2", async () => {
  const res = await request("/api/words?text=hello%0Aworld");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { text: "hello\nworld", words: 2, lines: 2 });
});

test("GET /api/words?text=%20%20 は空白だけなので words: 0", async () => {
  const res = await request("/api/words?text=%20%20");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { text: "  ", words: 0, lines: 1 });
});

test("GET /api/normalize?text=hello%20%20world は正規化結果を返す", async () => {
  const res = await request("/api/normalize?text=hello%20%20world");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { text: "hello  world", normalized: "hello world" });
});

test("GET /api/normalize で text がないときは 400", async () => {
  const res = await request("/api/normalize", 400);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { error: "text is required" });
});

test("GET /healthz/ は 200 と status: ok を返す", async () => {
  const res = await request("/healthz/");
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("GET /api/words/?text=a は末尾スラッシュを無視して 200 を返す", async () => {
  const res = await request("/api/words/?text=a");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { text: "a", words: 1, lines: 1 });
});

test("GET /api/words// は 404", async () => {
  await request("/api/words//", 404);
});

test("GET /api/stats?text=hello%20world は統計を返す", async () => {
  const res = await request("/api/stats?text=hello%20world");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { words: 2, chars: 11, bytes: 11 });
});

test("GET /api/stats?text=こんにちは は chars:5 bytes:15 を返す", async () => {
  const res = await request(`/api/stats?text=${encodeURIComponent("こんにちは")}`);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { words: 1, chars: 5, bytes: 15 });
});

test("GET /api/stats で text がないときは 400", async () => {
  const res = await request("/api/stats", 400);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { error: "text is required" });
});

test("GET /api/stats?text= は空文字列なので 400", async () => {
  const res = await request("/api/stats?text=", 400);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { error: "text is required" });
});

test("GET /api/stats/ は末尾スラッシュを無視して 200 を返す", async () => {
  const res = await request("/api/stats/?text=hello");
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.deepEqual(await res.json(), { words: 1, chars: 5, bytes: 5 });
});
