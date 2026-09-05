# gg — graph_gen

**リンク構造を、インタラクティブに。**

gg は、URLからサイトのリンク構造を採取し、Three.js ベースの3Dグラフとして可視化する汎用ツールです。Cloudflare Worker によるサーバーレスクロールと、Astro ベースの静的LPを組み合わせ、手軽にサイト構造を把握できます。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v0.1.7-blue.svg)](https://github.com/watanabe3tipapa/gg/releases)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-orange.svg)](https://workers.cloudflare.com/)
[![GitHub](https://img.shields.io/github/issues/watanabe3tipapa/gg.svg)](https://github.com/watanabe3tipapa/gg/issues)

---

## 概要

gg は以下のコンポーネントで構成されます:

- **Worker** — Cloudflare Worker + Durable Objects によるサーバーレスクローラー
- **Viewer** — Three.js による3Dインタラクティブグラフビューア
- **LP** — Astro ベースのランディングページ

起点URLからBFS（幅優先探索）でリンクを再帰的に辿り、ノード（ページ）とリンク（参照関係）のグラフデータを生成。それをThree.jsで3D空間に描画し、インタラクティブに操作できます。

---

## 主な特徴

- **3Dインタラクティブ** — Three.js によるリアルタイム3D描画。ドラッグ、ズーム、パン操作で自由に視点を変更
- **2つのレイアウト** — 力指向3D と 階層ツリー3D をワンクリックで切替
- **ストリーミング** — クロール進行状況をリアルタイムで表示。停止ボタンで途中中断も可能
- **InstancedMesh最適化** — 1000ノード以上でも滑らかな描画。GPUインスタンシングで大規模グラフに対応
- **JSON入出力** — graph.json をドラッグ&ドロップするだけ。JSON貼付やファイルエクスポートにも対応
- **Cloudflare Worker** — サーバーレスクローラー。CORS回避でどこからでもクロール可能

---

## 前提条件

| ツール | 必要バージョン | 確認コマンド |
|---|---:|---|
| Node.js | >= 18 | `node --version` |
| Wrangler | >= 3 | `wrangler --version` |
| Python 3 | 任意 (Viewer の簡易サーバー用) | `python3 --version` |

---

## 開始手順

### Worker セットアップ

```bash
cd worker
npm install
wrangler dev
# → http://localhost:8787
```

### Viewer セットアップ

```bash
cd viewer
python3 -m http.server 8080
# → http://localhost:8080/viewer/index.html
```

### Astro LP セットアップ

```bash
cd astro
npm install
npm run dev
# → http://localhost:4321
```

---

## 使い方

1. URL を入力して「クロール開始」をクリック
2. 3D グラフでリンク構造を可視化
3. 力指向3D / 階層ツリー3D を切替可能
4. ノードをクリックで詳細パネル表示（起点からの経路、関連リンク）
5. 「JSON出力」ボタンでグラフデータをダウンロード

---

## API

### POST /api/crawl

クロールを開始し、ストリーミングレスポンスで進行状況を返します。

```json
{
  "url": "https://example.com",
  "depth": 2,
  "sameOriginOnly": true
}
```

レスポンス（ストリーミング）:

```json
{ "type": "progress", "progress": { "current": 1, "total": 5, "message": "Fetched: ..." } }
{ "type": "complete", "data": { "startUrl": "...", "nodes": [...], "links": [...] } }
```

### GET /api/session?id=

セッションの状態を取得します。

### POST /api/session?id=

セッションを停止します。

---

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| クライアント | Astro + Three.js + InstancedMesh |
| サーバー | Cloudflare Worker + Durable Objects |
| クローラー | cheerio |
| ビルド | Wrangler (Worker) + Astro Build |

---

## リポジトリ構成（主なファイル・ディレクトリ）

```
gg/
├── worker/          # Cloudflare Worker API
├── viewer/          # Three.js 3D ビューア
├── astro/           # Astro LP
├── DEV-MEMO.md      # 実装メモ
├── LICENSE
└── README.md
```

---

## コントリビューション

コントリビューションは歓迎します。大きな変更は事前に issue を立ててください。

基本的なワークフロー:

1. リポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/your-feature`)
3. 変更をコミット (`git commit -m 'Add your change'`)
4. ブランチをプッシュし、Pull Request を作成

---

## デプロイ

### GitHub Pages

1. GitHub リポジトリの Settings → Pages
2. Source: GitHub Actions を選択
3. push で自動デプロイ

### Cloudflare Pages

1. Cloudflare Dashboard → Pages → Create a project
2. リポジトリ `watanabe3tipapa/gg` を接続
3. Build command: `npm run build`（root package.json。Astro build + `dist` へのコピー + `/gg` base の除去を行う）
4. Build output directory: `dist`
5. 参照: `https://gg-7sj.pages.dev/`

### Worker API

```bash
cd worker
npm install
npx wrangler deploy
# → https://gg-worker.watanabe3ti.workers.dev
```

---

## ライセンス

MIT ライセンス — 詳細は LICENSE ファイルを参照してください。

---

## 開発・保守状態

- リポジトリはアーカイブされていません。
- 最終更新: 2026-09-05
