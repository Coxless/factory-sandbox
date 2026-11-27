# factory-sandbox

[sakura-software-factory](https://github.com/Coxless/sakura-software-factory) の動作確認とデモに使う対象リポジトリ。
Issue に `@agent <依頼>` とコメントすると、ファクトリーが計画・実装・検査を行う。

- 依存なしの Node.js（24 以上）と pnpm
- 検査: `pnpm run check`（`node --test`）。CI（`.github/workflows/ci.yml`）の必須チェック `check` も同じ
- ステージング: main にマージされると、ファクトリーが `Dockerfile` でビルドして入れ替える。`GET /healthz` が通らなければ直前の版に戻す
- ローカルで動かす: `node src/server.js`（`PORT` 既定 3000）

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

指定した文字列に含まれる単語の数を返す。

```bash
curl "http://localhost:3000/api/words?text=hello+world"
```

レスポンス:

```json
{"text": "hello world", "words": 2}
```

`text` パラメータがない場合は `400` を返す。

```bash
curl http://localhost:3000/api/words
```

レスポンス:

```json
{"error": "text is required"}
```

未知のパスに対しては `404`、GET 以外の HTTP メソッドに対しては `405` を返す。
