import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { countLines, countWords, getStats, normalizeSpaces } from "./text.js";

/**
 * @typedef {import("node:http").IncomingMessage} IncomingMessage
 * @typedef {import("node:http").ServerResponse} ServerResponse
 */

/** /api/words で受け付ける text の最大長（文字数）。 */
const MAX_TEXT_LENGTH = 10000;

/**
 * GET /healthz のハンドラ。HEAD も同じヘッダーで本文なしで応答する。
 * 200: { status: "ok" }（GET の場合。HEAD は本文なし）
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @returns {void}
 */
function getHealthz(req, res) {
  sendJson(res, 200, req.method === "HEAD" ? undefined : { status: "ok" });
}

/**
 * GET /api/words のハンドラ。
 * 200: { text, words, lines }
 * 400: { error: "text is required" }
 * 413: { error: "text is too long" }
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {URL} url
 * @returns {void}
 */
function getApiWords(req, res, url) {
  const text = url.searchParams.get("text");
  if (text === null || text === "") {
    sendJson(res, 400, { error: "text is required" });
    return;
  }
  if (text.length > MAX_TEXT_LENGTH) {
    sendJson(res, 413, { error: "text is too long" });
    return;
  }
  sendJson(res, 200, { text, words: countWords(text), lines: countLines(text) });
}

/**
 * GET /api/normalize のハンドラ。
 * 200: { text, normalized }
 * 400: { error: "text is required" }
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {URL} url
 * @returns {void}
 */
function getApiNormalize(req, res, url) {
  const text = url.searchParams.get("text");
  if (text === null || text === "") {
    sendJson(res, 400, { error: "text is required" });
    return;
  }
  sendJson(res, 200, { text, normalized: normalizeSpaces(text) });
}

/**
 * GET /api/stats のハンドラ。
 * 200: { words, chars, bytes }
 * 400: { error: "text is required" }
 * @param {IncomingMessage} _req
 * @param {ServerResponse} res
 * @param {URL} url
 * @returns {void}
 */
function getApiStats(_req, res, url) {
  const text = url.searchParams.get("text");
  if (text === null || text === "") {
    sendJson(res, 400, { error: "text is required" });
    return;
  }
  sendJson(res, 200, getStats(text));
}

/**
 * GET / のハンドラ。
 * 200: HTML 本文
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
  ["/api/stats", getApiStats],
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
 * ステータスコードとヘッダーを設定してレスポンスを終了する。
 * HEAD リクエストの場合は本文を返さない。
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {number} statusCode
 * @param {import("node:http").OutgoingHttpHeaders} headers
 * @param {string} body
 * @returns {void}
 */
function respond(req, res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  res.end(req.method === "HEAD" ? undefined : body);
}

/**
 * JSON 本文を返す。
 * @param {ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 * @returns {void}
 */
function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

/**
 * ステージングで動くデモアプリの HTTP サーバーを作る（待ち受けは呼び出し側）。
 * `GET /healthz` は正常なら 200 を返す（ファクトリーのヘルスチェックが使う）。
 *
 * 登録されているルート:
 * - `GET /healthz` → 200 `{ status: "ok" }`（`HEAD` は本文なし）
 * - `GET /api/words?text=...` → 200 `{ text, words, lines }` または 400 `{ error: "text is required" }`
 * - `GET /api/normalize?text=...` → 200 `{ text, normalized }` または 400 `{ error: "text is required" }`
 * - `GET /api/stats?text=...` → 200 `{ words, chars, bytes }` または 400 `{ error: "text is required" }`
 * - `GET /` → 200 HTML
 *
 * @returns {import("node:http").Server}
 */
export function createApp() {
  return createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, {
        "content-type": "text/plain; charset=utf-8",
        allow: "GET, HEAD",
      });
      res.end("method not allowed\n");
      return;
    }

    const url = new URL(req.url ?? "", "http://localhost");
    const pathname = normalizePathname(url.pathname);

    if (pathname === null) {
      respond(req, res, 404, { "content-type": "text/plain; charset=utf-8" }, "not found\n");
      return;
    }

    const handler = routes.get(pathname);

    if (handler !== undefined) {
      handler(req, res, url);
      return;
    }

    respond(req, res, 404, { "content-type": "text/plain; charset=utf-8" }, "not found\n");
  });
}

// node src/server.js で起動したときだけ待ち受ける（テストでは import するだけ）
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  createApp().listen(port, "0.0.0.0", () => {
    console.log(`listening on ${port}`);
  });
}
