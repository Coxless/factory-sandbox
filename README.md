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

### `countLines(input)`

文字列に含まれる行数を数える。`\n` と `\r\n` を改行として扱い、空文字列は 0、末尾の改行は数えない。

- `input`: 対象の文字列（`string`）
- 戻り値: 行数（`number`）

例:

```js
import { countLines } from "./src/text.js";

countLines("a\nb\nc");
// => 3
```

### `countChars(input)`

文字列の文字数を書記素クラスター単位で数える。

- `input`: 対象の文字列（`string`）
- 戻り値: 文字数（`number`）

例:

```js
import { countChars } from "./src/text.js";

countChars("日本語");
// => 3
```

### `getStats(input)`

文字列の統計情報を返す。単語数、文字数（書記素クラスター数）、UTF-8 バイト数を含む。

- `input`: 対象の文字列（`string`）
- 戻り値: `{ words: number, chars: number, bytes: number }`

例:

```js
import { getStats } from "./src/text.js";

getStats("hello  world");
// => { words: 2, chars: 12, bytes: 12 }
```

### `truncate(input, max)`

文字列を指定の長さに切り詰める。`max` は 1 以上の整数。

- `input`: 対象の文字列（`string`）
- `max`: 最大の長さ（`number`）
- 戻り値: 切り詰められた文字列（`string`）

例:

```js
import { truncate } from "./src/text.js";

truncate("hello world", 8);
// => "hello w…"
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
{"status":"ok"}
```

### `GET /api/words?text=<文字列>`

指定した文字列に含まれる単語数と行数を返す。

```bash
curl "http://localhost:3000/api/words?text=hello%20world"
```

レスポンス:

```json
{"text":"hello world","words":2,"lines":1}
```

`text` パラメータがない場合は `400` を返す。

```bash
curl http://localhost:3000/api/words
```

レスポンス:

```json
{"error":"text is required"}
```

`text` パラメータを複数指定した場合も `400` を返す。

```bash
curl "http://localhost:3000/api/words?text=a&text=b"
```

レスポンス:

```json
{"error":"text must be given once"}
```

### `GET /api/normalize?text=<文字列>`

指定した文字列の前後の空白を取り除き、連続する空白を 1 つにまとめた結果を返す。

```bash
curl "http://localhost:3000/api/normalize?text=hello%20%20world"
```

レスポンス:

```json
{"text":"hello  world","normalized":"hello world"}
```

`text` パラメータがない場合は `400` を返す。

```bash
curl http://localhost:3000/api/normalize
```

レスポンス:

```json
{"error":"text is required"}
```

`text` パラメータを複数指定した場合も `400` を返す。

```bash
curl "http://localhost:3000/api/normalize?text=a&text=b"
```

レスポンス:

```json
{"error":"text must be given once"}
```

`text` が 10000 文字を超える場合は `413` を返す。

```bash
curl "http://localhost:3000/api/normalize?text=$(python3 -c 'print("a"*10001)')"
```

レスポンス:

```json
{"error":"text is too long"}
```

### `GET /api/stats?text=<文字列>`

指定した文字列の単語数、文字数（書記素クラスター数）、UTF-8 バイト数を返す。

```bash
curl "http://localhost:3000/api/stats?text=hello%20world"
```

レスポンス:

```json
{"words":2,"chars":11,"bytes":11}
```

日本語や絵文字も文字数と UTF-8 バイト数を区別して返す。

```bash
curl "http://localhost:3000/api/stats?text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF"
```

レスポンス:

```json
{"words":1,"chars":5,"bytes":15}
```

`text` パラメータがない場合は `400` を返す。

```bash
curl http://localhost:3000/api/stats
```

レスポンス:

```json
{"error":"text is required"}
```

`text` パラメータを複数指定した場合も `400` を返す。

```bash
curl "http://localhost:3000/api/stats?text=a&text=b"
```

レスポンス:

```json
{"error":"text must be given once"}
```

`text` が 10000 文字を超える場合は `413` を返す。

```bash
curl "http://localhost:3000/api/stats?text=$(python3 -c 'print("a"*10001)')"
```

レスポンス:

```json
{"error":"text is too long"}
```

### `GET /api/truncate?text=<文字列>&max=<整数>`

指定した文字列を `max` の長さに切り詰めた結果を返す。`max` は 1 以上の整数。

```bash
curl "http://localhost:3000/api/truncate?text=hello&max=3"
```

レスポンス:

```json
{"text":"hello","truncated":"he…"}
```

`text` パラメータがない場合は `400` を返す。

```bash
curl http://localhost:3000/api/truncate
```

レスポンス:

```json
{"error":"text is required"}
```

`max` パラメータが 1 以上の整数でない場合も `400` を返す。

```bash
curl "http://localhost:3000/api/truncate?text=hello&max=abc"
```

レスポンス:

```json
{"error":"max must be a positive integer"}
```

未知のパスに対しては `404` を返す。`/api/` で始まるパスの場合は `{"error":"not found"}`（`content-type: application/json; charset=utf-8`）、それ以外のパスはテキストで返す。GET 以外の HTTP メソッドに対しては `405` を返す。

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
