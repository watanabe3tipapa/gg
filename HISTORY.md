# HISTORY.md

gg (graph_gen) のバージョン履歴。

---

## v0.1.0 (2026-08-27)

初回リリース。

### 追加機能

- **Worker API** — Cloudflare Worker + Durable Objects によるサーバーレスクローラー
  - BFS（幅優先探索）で起点URLからリンクを再帰的に探査
  - 深度ごとの分割リクエスト対応
  - ストリーミングレスポンスで進行状況をリアルタイム表示
  - セッション管理・停止機能

- **3D Viewer** — Three.js ベースのインタラクティブ3Dグラフビューア
  - InstancedMesh による GPU インスタンシング最適化
  - 力指向3D レイアウト
  - 階層ツリー3D レイアウト
  - レイアウト切替機能
  - ノードクリックで詳細パネル表示
  - 起点からの最短経路表示
  - 深度カラーコーディング
  - JSON入力（D&D / テキスト貼付 / デモモード）
  - JSONエクスポート

- **Astro LP** — ランディングページ
  - ツール紹介セクション
  - ビューア埋め込み
  - API仕様セクション

### 技術スタック

| レイヤー | 技術 |
|----------|------|
| クライアント | Astro + Three.js + InstancedMesh |
| サーバー | Cloudflare Worker + Durable Objects |
| クローラー | cheerio |
| ビルド | Wrangler (Worker) + Astro Build |
