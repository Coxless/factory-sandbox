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

test("/healthz は 200 と status: ok を返す", async () => {
  const res = await fetch(`${base}/healthz`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("/ は HTML を返す", async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /factory-sandbox/);
});

test("知らないパスは 404", async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
});
