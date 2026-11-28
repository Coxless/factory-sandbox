# factory-sandbox

[sakura-software-factory](https://github.com/Coxless/sakura-software-factory) の動作確認とデモに使う対象リポジトリ。
Issue に `@agent <依頼>` とコメントすると、ファクトリーが計画・実装・検査を行う。

- 依存なしの Node.js（24 以上）と pnpm
- 検査: `pnpm run check`（`node --test`）。CI（`.github/workflows/ci.yml`）の必須チェック `check` も同じ
- ステージング: main にマージされると、ファクトリーが `Dockerfile` でビルドして入れ替える。`GET /healthz` が通らなければ直前の版に戻す
- ローカルで動かす: `node src/server.js`（`PORT` 既定 3000）

## ライブラリ

`src/text.js` で公開している関数。

### `normalizeSpaces(input)`

文字列の前後の空白を取り除き、連続する空白を 1 つにまとめる。

- `input`: 対象の文字列（`string`）
- 戻り値: 正規化された文字列（`string`）

例:

```js
import { normalizeSpaces } from "./src/text.js";

normalizeSpaces("  hello   world  ");
// => "hello world"
```

### `countWords(input)`

文字列に含まれる単語の数を数える。空白区切りで、英数字または文字を含むトークンを単語として扱う。

- `input`: 対象の文字列（`string`）
- 戻り値: 単語の数（`number`）

例:

```js
import { countWords } from "./src/text.js";

countWords("hello world");
// => 2
```

## HTTP API

ステージングで動いている HTTP API のエンドポイント。

### `GET /healthz`

サービスの状態を返す。

```bash
curl http://localhost:3000/healthz
```

レスポンス:

```json
{"status": "ok"}
```

### `GET /api/words?text=<文字列>`

指定した文字列に含まれる単語数と行数を返す。

```bash
curl "http://localhost:3000/api/words?text=hello+world"
```

レスポンス:

```json
{"text": "hello world", "words": 2, "lines": 1}
```

`text` パラメータがない場合は `400` を返す。

```bash
curl http://localhost:3000/api/words
```

レスポンス:

```json
{"error": "text is required"}
```

### `GET /api/normalize?text=<文字列>`

指定した文字列の前後の空白を取り除き、連続する空白を 1 つにまとめた結果を返す。

```bash
curl "http://localhost:3000/api/normalize?text=hello++world"
```

レスポンス:

```json
{"text": "hello  world", "normalized": "hello world"}
```

`text` パラメータがない場合は `400` を返す。

```bash
curl http://localhost:3000/api/normalize
```

レスポンス:

```json
{"error": "text is required"}
```

### `GET /api/stats?text=<文字列>`

指定した文字列の単語数、文字数（コードポイント数）、UTF-8 バイト数を返す。

```bash
curl "http://localhost:3000/api/stats?text=hello+world"
```

レスポンス:

```json
{"words": 2, "chars": 11, "bytes": 11}
```

日本語や絵文字も文字数と UTF-8 バイト数を区別して返す。

```bash
curl "http://localhost:3000/api/stats?text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
```

レスポンス:

```json
{"words": 1, "chars": 5, "bytes": 15}
```

`text` パラメータがない場合は `400` を返す。

```bash
curl http://localhost:3000/api/stats
```

レスポンス:

```json
{"error": "text is required"}
```

未知のパスに対しては `404`、GET 以外の HTTP メソッドに対しては `405` を返す。

## 開発

### 依存のインストール

```bash
pnpm install
```

### テスト

すべてのテストを実行する:

```bash
pnpm run check
```

1 つのテストファイルだけを流す場合:

```bash
node --test src/text.test.js
```

### ローカルでサーバーを動かす

```bash
node src/server.js
```

別のターミナルで `/healthz` を叩く:

```bash
curl http://localhost:3000/healthz
```
