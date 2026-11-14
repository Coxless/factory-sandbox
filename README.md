# factory-sandbox

[sakura-software-factory](https://github.com/Coxless/sakura-software-factory) の動作確認とデモに使う対象リポジトリ。
Issue に `@agent <依頼>` とコメントすると、ファクトリーが計画・実装・検査を行う。

- 依存なしの Node.js（24 以上）と pnpm
- 検査: `pnpm run check`（`node --test`。テストは `src/*.test.js`）

このリポジトリの Issue・コメントは公開される。秘密情報や個人情報を書かない。
