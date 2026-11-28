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
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("/ は HTML を返す", async () => {
  const res = await request("/");
  assert.match(await res.text(), /factory-sandbox/);
});

test("知らないパスは 404", async () => {
  await request("/nope", 404);
});

test("POST /healthz は 405 method not allowed", async () => {
  const res = await request("/healthz", 405, { method: "POST" });
  assert.equal(await res.text(), "method not allowed\n");
});

test("DELETE /api/words は 405", async () => {
  await request("/api/words", 405, { method: "DELETE" });
});

test("GET /api/words?text=hello%20world は単語数を返す", async () => {
  const res = await request("/api/words?text=hello%20world");
  assert.equal(res.headers.get("content-type"), "application/json");
  assert.deepEqual(await res.json(), { text: "hello world", words: 2 });
});

test("GET /api/words?text=日本語の全角スペース区切りも数える", async () => {
  const res = await request(`/api/words?text=${encodeURIComponent("こんにちは　世界")}`);
  assert.deepEqual(await res.json(), { text: "こんにちは　世界", words: 2 });
});

test("GET /api/words で text がないときは 400", async () => {
  const res = await request("/api/words", 400);
  assert.equal(res.headers.get("content-type"), "application/json");
  assert.deepEqual(await res.json(), { error: "text is required" });
});

test("GET /api/words?text= は空文字列なので 400", async () => {
  const res = await request("/api/words?text=", 400);
  assert.equal(res.headers.get("content-type"), "application/json");
  assert.deepEqual(await res.json(), { error: "text is required" });
});

test("GET /api/words?text=%20%20 は空白だけなので words: 0", async () => {
  const res = await request("/api/words?text=%20%20");
  assert.equal(res.headers.get("content-type"), "application/json");
  assert.deepEqual(await res.json(), { text: "  ", words: 0 });
});

test("GET /api/normalize?text=hello%20%20world は正規化結果を返す", async () => {
  const res = await request("/api/normalize?text=hello%20%20world");
  assert.equal(res.headers.get("content-type"), "application/json");
  assert.deepEqual(await res.json(), { text: "hello  world", normalized: "hello world" });
});

test("GET /api/normalize で text がないときは 400", async () => {
  const res = await request("/api/normalize", 400);
  assert.equal(res.headers.get("content-type"), "application/json");
  assert.deepEqual(await res.json(), { error: "text is required" });
});
