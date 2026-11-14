# factory-sandbox

[sakura-software-factory](https://github.com/Coxless/sakura-software-factory) の動作確認とデモに使う対象リポジトリ。
Issue に `@agent <依頼>` とコメントすると、ファクトリーが計画・実装・検査を行う。

- 依存なしの Node.js（24 以上）と pnpm
- 検査: `pnpm run check`（`node --test`）。CI（`.github/workflows/ci.yml`）の必須チェック `check` も同じ
- ステージング: main にマージされると、ファクトリーが `Dockerfile` でビルドして入れ替える。`GET /healthz` が通らなければ直前の版に戻す
- ローカルで動かす: `node src/server.js`（`PORT` 既定 3000）

このリポジトリの Issue・コメントは公開される。秘密情報や個人情報を書かない。
