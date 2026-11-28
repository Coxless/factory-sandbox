import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { countWords, normalizeSpaces } from "./text.js";

/**
 * @typedef {import("node:http").IncomingMessage} IncomingMessage
 * @typedef {import("node:http").ServerResponse} ServerResponse
 */

/**
 * GET /healthz のハンドラ。
 * @param {IncomingMessage} _req
 * @param {ServerResponse} res
 * @returns {void}
 */
function getHealthz(_req, res) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ status: "ok" }));
}

/**
 * GET /api/words のハンドラ。
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {URL} url
 * @returns {void}
 */
function getApiWords(req, res, url) {
  const text = url.searchParams.get("text");
  if (text === null || text === "") {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "text is required" }));
    return;
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ text, words: countWords(text) }));
}

/**
 * GET /api/normalize のハンドラ。
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {URL} url
 * @returns {void}
 */
function getApiNormalize(req, res, url) {
  const text = url.searchParams.get("text");
  if (text === null || text === "") {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "text is required" }));
    return;
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ text, normalized: normalizeSpaces(text) }));
}

/**
 * GET / のハンドラ。
 * @param {IncomingMessage} _req
 * @param {ServerResponse} res
 * @returns {void}
 */
function getRoot(_req, res) {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(
    '<!doctype html><html lang="ja"><meta charset="utf-8"><title>factory-sandbox</title>' +
      "<h1>factory-sandbox</h1><p>sakura-software-factory のステージングで動いています。</p></html>\n",
  );
}

/**
 * pathname からハンドラ関数を引くルート表。
 * 各ハンドラは (req, res, url) を受け取る。
 * @type {Map<string, (req: IncomingMessage, res: ServerResponse, url: URL) => void>}
 */
const routes = new Map([
  ["/healthz", getHealthz],
  ["/api/words", getApiWords],
  ["/api/normalize", getApiNormalize],
  ["/", getRoot],
]);

/**
 * 末尾のスラッシュを正規化する。
 * "/" 自体はそのままにし、1 つだけの末尾スラッシュは取り除く。
 * 2 つ以上続くスラッシュは正規化せず null を返す。
 * @param {string} pathname
 * @returns {string | null}
 */
function normalizePathname(pathname) {
  if (pathname === "/") {
    return pathname;
  }
  if (pathname.endsWith("/")) {
    const trimmed = pathname.slice(0, -1);
    if (trimmed.endsWith("/")) {
      return null;
    }
    return trimmed;
  }
  return pathname;
}

/**
 * ステージングで動くデモアプリの HTTP サーバーを作る（待ち受けは呼び出し側）。
 * `GET /healthz` は正常なら 200 を返す（ファクトリーのヘルスチェックが使う）。
 * @returns {import("node:http").Server}
 */
export function createApp() {
  return createServer((req, res) => {
    if (req.method !== "GET") {
      res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
      res.end("method not allowed\n");
      return;
    }

    const url = new URL(req.url ?? "", "http://localhost");
    const pathname = normalizePathname(url.pathname);

    if (pathname === null) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found\n");
      return;
    }

    const handler = routes.get(pathname);

    if (handler !== undefined) {
      handler(req, res, url);
      return;
    }

    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found\n");
  });
}

// node src/server.js で起動したときだけ待ち受ける（テストでは import するだけ）
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, "0.0.0.0", () => {
    console.log(`listening on ${port}`);
  });
}
