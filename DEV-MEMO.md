# DEV-MEMO.md — gg (graph_gen) 実装メモ

## 概要
汎用グラフ生成ツール。URLからリンク構造を採取し、Three.js 3Dで可視化する。

## 現在のバージョン
- **v0.1.7 (2026-09-05)** — バージョン管理箇所を統一: README バッジ / `astro/package.json` / `worker/package.json` / 各 lock / HISTORY.md

## デプロイ先（2026-09-05 確定）
- GitHub Pages: `https://watanabe3tipapa.github.io/gg/`（Actions で `astro/dist` をアップロード）
- Cloudflare Pages: `https://gg-7sj.pages.dev/`（dashboard Git連携。Build: `npm run build` / Output: `dist`）
- Worker API: `https://gg-worker.watanabe3ti.workers.dev/`
- Cloudflare アカウント: `watanabe3tipapa - Account`（ID `ffffc09ed50f0e79f23694b06e4cf413`）
- CF Pages のドメインはプロジェクト名 `gg` ではなくランダム suffix（`gg-7sj`）が付く点に注意

## アーキテクチャ
- **Client**: Astro LP + Three.js 3D Viewer
- **Server**: Cloudflare Worker + Durable Objects (SQLite: `new_sqlite_classes`)
- **Crawler**: 標準 fetch + cheerio（kitesurf は使用していない。旧メモの記載は誤り）

## 実装進捗

### Phase 1: Worker API ✅
- [x] プロジェクト構成作成
- [x] wrangler.toml 設定
- [x] crawler.ts (BFSクロールロジック)
- [x] index.ts (Worker メイン)
- [x] types.ts (型定義)
- [x] 深度分割リクエスト対応
- [x] Streaming レスポンス

### Phase 2: Durable Objects ✅
- [x] session.ts (セッション管理)
- [x] 停止機能実装
- [x] 状態管理

### Phase 3: Three.js 3D Viewer ✅
- [x] index.html (ビューアLP)
- [x] graph-renderer.js (InstancedMesh描画)
- [x] layout-force3d.js (力指向3D)
- [x] controls.js (インタラクション)
- [x] panel.js (サイドパネル/統計)

### Phase 4: 階層ツリー3D ✅
- [x] layout-tree3d.js (階層ツリー3D)
- [x] レイアウト切替機能

### Phase 5: Astro LP ✅
- [x] astro.config.mjs
- [x] Layout.astro
- [x] index.astro (LP)
- [x] GraphViewer.astro (コンポーネント)

### Phase 6: 統合テスト（総点検 2026-09-05 実施）
- [x] 実URL動作確認（Worker デプロイ済み: `gg-worker.watanabe3ti.workers.dev`）
- [x] ノード重複排除（`createGraphData` で `id` 単位に dedup。深度分割ループで同じノードが重複追加される問題を修正）
- [x] URLスキーム自動補完（`https://` なしの入力でも `ensureScheme` で正規化。`new URL()` 例外を防止）
- [x] viewer 統計のゼロ除算ガード（ノード 0 件時に NaN / 平均次数 `0.0`）
- [x] viewer クロールフォームの URL 正規化（`normalizeUrl` 追加）
- [x] Astro LP の `/gg` base パス修正（logo `/gg/`、favicon `/gg/` 対応。GitHub Pages 用。CF Pages は root `package.json` の sed で `/gg` を除去）
- [x] viewer API サンプルコードを Worker 実URLに更新
- [x] deploy.yml から壊れた `deploy-cloudflare` ジョブを削除（CF Pages は dashboard Git 連携で解決済み。Actions 側の `pages deploy dist` はルートに `dist` が無く失敗していた）
- [x] `astro/wrangler.toml` 削除（実験用の残骸。不要）
- [x] ビルド検証（root `npm run build` が macOS でも成功するよう `sed -i ''` に修正）
- [x] viewer/ と astro/public/viewer の同期確認（`diff -r` で一致）
- [ ] パフォーマンス検証（大規模グラフのフレームレート）
- [x] bump_graghview はリポジトリ内に存在しないことを確認（README 等の言及もなし）

## 技術スタック
| レイヤー | 技術 |
|----------|------|
| クライアント | Astro + Three.js + InstancedMesh |
| サーバー | Cloudflare Worker + Durable Objects (SQLite) |
| クローラー | fetch + cheerio |
| ビルド | Wrangler (Worker) + Astro Build（root package.json で `/gg` 除去） |

## ファイル構成
```
gg/
├── worker/
│   ├── src/
│   │   ├── index.ts
│   │   ├── crawler.ts
│   │   ├── session.ts
│   │   └── types.ts
│   ├── wrangler.toml
│   └── package.json
├── viewer/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       ├── graph-renderer.js
│       ├── layout-force3d.js
│       ├── layout-tree3d.js
│       ├── controls.js
│       └── panel.js
├── astro/
│   ├── astro.config.mjs
│   ├── package.json
│   └── src/
│       ├── layouts/Layout.astro
│       ├── pages/index.astro
│       └── components/GraphViewer.astro
├── .github/workflows/deploy.yml
├── package.json（ルート。CF Pages ビルド用）
└── README.md
```

## 決定事項
- 既存 bump_graghview のタイポは意図的（テスト用）→ 2026-09-05 点検で存在しないことを確認
- 深度ごとに分割リクエスト（Worker CPU タイムアウト対策）。crawler の各 depth 呼び出しは独立して BFS するが、`createGraphData` で最終結果をノード単位に重複排除
- Durable Objects でセッション管理・停止機能を実現
- InstancedMesh で初期最適化
- 力指向3D と 階層ツリー3D を切替可能にする
- GitHub Pages は `base: '/gg'`、CF Pages は root `package.json` の `sed` で `/gg` を `/` に置換して両対応
- `viewer/` と `astro/public/viewer/` は同一内容を維持する（変更時は `cp` で同期）

## 総点検ログ（2026-09-05）
1. **クロールの URL スキーム問題を修正** — 入力が `watanabe3ti.com` のようなスキームなし URL の場合、Worker の `new URL()` が例外を投げてクロールが失敗していた。`crawler.ensureScheme()` を追加し、セッションとクライアント双方で自動補完。
2. **ノード重複問題を修正** — 深度分割ループ（d=0..depth）が各深さで同じノードを返すため、`createGraphData` が `Map` でノードを dedup するよう修正。stats.nodes と描画ノード数が正しくなった。
3. **viewer 統計のバグ修正** — 0 ノード時に `Math.max([])` → `-Infinity`、0 除算 → `NaN` になるのをガード。
4. **Astro base パスの修正** — `base: '/gg'` 環境（GitHub Pages）で logo / favicon がルート相対（`/`, `/favicon.svg`）だと壊れるため `/gg/` 付きに変更。CF Pages は sed で変換。
5. **deploy-cloudflare ジョブ削除** — Actions の `pages deploy dist` はルートに `dist`（ビルド成果物）が無く必ず失敗していたが、CF Pages は dashboard の Git 連携でビルドするため重複。削除して CI を GH Pages のみに。
6. **`sed -i` の互換性修正** — macOS（BSD sed）で `-i` が引数を要求するため `-i ''` に変更。ローカルでの `npm run build` が可能に。
7. **ドキュメント更新** — HISTORY.md の誤 URL（`gg.pages.dev` → `gg-7sj.pages.dev`）、README/README_en のデプロイ手順（Root directory `astro` 記述を廃止）、Worker URL 追記を実施。
8. **Worker 消滅による 404（Load failed）を再デプロイで復旧（2026-09-05）** — `https://gg-worker.watanabe3ti.workers.dev` が全パス 404（error code 1042）になっていた。`wrangler deployments list` で「Worker does not exist」を確認し、`npx wrangler deploy` で復旧。Worker はアカウント上から消えることがあるため、異常時はまず `deployments list` と `curl` で稼働確認する。
9. **viewer のストリーミング JSON 解析修正（2026-09-05, commit `2ad0f9b`）** — Worker は各イベントを `\n` 付き JSON 行でストリーミングするが、HTTP チャンク境界で 1 行が途中分割され `JSON.parse` が `Unterminated string` で失敗。viewer/js/app.js をバッファ方式（行分割後の残りを次チャンクに持ち越し）に修正。`TextDecoder.decode(value, { stream: true })` で UTF-8 の途中分割にも対応。`viewer/` → `astro/public/viewer/` に同期。
