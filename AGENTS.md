# AGENTS.md

このリポジトリで作業するエージェント向けの決まり。

- 言語は JavaScript（ES Modules）。TypeScript や依存パッケージを足さない
- コードは `src/` に置き、テストは同じ場所に `*.test.js` で書く（`node:test` と `node:assert/strict`）
- 変更したら `pnpm run check` が通ることを確かめる
- 関数には JSDoc で引数と戻り値の型を書く
