# HISTORY.md

gg (graph_gen) のバージョン履歴。

---

## v0.1.2 (2026-09-05)

総点検（機能・整合性チェック）。

- crawler ノード重複排除・URLスキーム自動補完
- viewer 統計のゼロ除算ガード・URL正規化
- Astro LP の `/gg` base パス修正（logo / favicon）
- viewer API サンプルを Worker 実URLに更新
- deploy.yml から壊れた deploy-cloudflare ジョブを削除（CF Pages は Git 連携）
- astro/wrangler.toml 削除
- ドキュメント URL 修正

## v0.1.1 (2026-08-27)

Cloudflare Pages デプロイ設定の確定（root package.json の build スクリプトで `/gg` base を CF 用に除去）。

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

### デプロイ

- GitHub Pages: `https://watanabe3tipapa.github.io/gg/`
- Cloudflare Pages: `https://gg-7sj.pages.dev/`
- Worker API: `https://gg-worker.watanabe3ti.workers.dev/`
- GitHub Actions で GitHub Pages 自動デプロイ
- Cloudflare Pages はダッシュボードの Git 連携で自動デプロイ（Build command: `npm run build`、output: `dist`）

---
