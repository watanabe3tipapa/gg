# HISTORY.md

gg (graph_gen) のバージョン履歴。

---

## v0.1.7 (2026-09-05)

現在のリリース状態。バージョン表記の全箇所を統一。

- バージョン統一: README バッジ・`astro/package.json`・`worker/package.json`（各 lock 含む）を v0.1.7 に更新
- ドキュメント整備: タイポ修正（`视角` → `視点`）、デプロイ URL の実値反映
- viewer のストリーミング JSON 解析修正（チャンク境界で JSON 行が分割され `Unterminated string` になる問題をバッファ方式に修正）: commit `2ad0f9b`
- Worker 404 復旧（アカウント上から Worker が消えていたのを `wrangler deploy` で再デプロイ）
- CF Pages ビルド失敗修正（`sed -i ''` が Linux ビルド環境で失敗 → `sed -i.bak` + `rm` の両 OS 対応に変更）: commit `a67a5c0`
- **リポジトリを public 化** — private のままでは GitHub Pages が使えなかったため。public 化で GH Pages 復活（commit `56eaff7` でデプロイ再実行 → success）
- デプロイ状態:
  - GitHub Pages: `https://watanabe3tipapa.github.io/gg/`（Actions 自動デプロイ）
  - Cloudflare Pages: `https://gg-7sj.pages.dev/`（dashboard Git 連携、Build: `npm run build` / Output: `dist`）
  - Worker API: `https://gg-worker.watanabe3ti.workers.dev/`

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
