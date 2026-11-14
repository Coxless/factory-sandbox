# AGENTS.md

このリポジトリで作業するエージェント向けの決まり。

- 言語は JavaScript（ES Modules）。TypeScript や依存パッケージを足さない
- コードは `src/` に置き、テストは同じ場所に `*.test.js` で書く（`node:test` と `node:assert/strict`）
- 変更したら `pnpm run check` が通ることを確かめる
- 関数には JSDoc で引数と戻り値の型を書く

## ステージング

main にマージされた変更は、ファクトリーがステージングに自動でデプロイする。次の約束を守る。

- リポジトリの直下の `Dockerfile` で、追加の引数なしにイメージをビルドできる
- コンテナの中で `PORT`（3000）で待ち受ける。入口は `src/server.js`
- `GET /healthz` は正常なら `200` を返す。ここが通らないと、ファクトリーは直前の版に戻して revert PR を作る
- 読み取り専用のルート・非 root のユーザーで動く。書き込みは `/tmp` だけ
- 起動は数秒以内に終わらせる（ヘルスチェックは 60 秒で打ち切る）
- `Dockerfile`・`.github/workflows` はファクトリーからは変更しない（人間が変える）

