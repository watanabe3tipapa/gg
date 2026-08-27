# DEV-MEMO.md — gg (graph_gen) 実装メモ

## 概要
汎用グラフ生成ツール。URLからリンク構造を採取し、Three.js 3Dで可視化する。

## アーキテクチャ
- **Client**: Astro LP + Three.js 3D Viewer
- **Server**: Cloudflare Worker + Durable Objects
- **Crawler**: kitesurf + cheerio

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

### Phase 6: 統合テスト
- [ ] 実URL動作確認
- [ ] パフォーマンス検証
- [ ] bump_graghview 削除

## 技術スタック
| レイヤー | 技術 |
|----------|------|
| クライアント | Astro + Three.js + InstancedMesh |
| サーバー | Cloudflare Worker + Durable Objects |
| クローラー | kitesurf + cheerio |
| ビルド | Wrangler (Worker) + Astro Build |

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
└── README.md
```

## 決定事項
- 既存 bump_graghview のタイポは意図的（テスト用）
- 深度ごとに分割リクエスト（Worker制限対策）
- Durable Objects でセッション管理・停止機能を実現
- InstancedMesh で初期最適化
- 力指向3D と 階層ツリー3D を切替可能にする
