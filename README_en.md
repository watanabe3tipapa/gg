# gg — graph-gen

**Links, visualized interactively.**

gg is a general-purpose tool that crawls a website's link structure from a URL and visualizes it as an interactive 3D graph using Three.js. It combines a serverless crawler powered by Cloudflare Worker with a static landing page built on Astro.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v0.1.7-blue.svg)](https://github.com/watanabe3tipapa/gg/releases)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-orange.svg)](https://workers.cloudflare.com/)
[![GitHub](https://img.shields.io/github/issues/watanabe3tipapa/gg.svg)](https://github.com/watanabe3tipapa/gg/issues)

[日本語](README.md) | [English](README_en.md)

---

## Overview

gg consists of the following components:

- **Worker** — Serverless crawler built on Cloudflare Worker + Durable Objects
- **Viewer** — Interactive 3D graph visualizer powered by Three.js
- **LP** — Landing page built with Astro

Starting from a URL, the crawler recursively follows links using BFS (Breadth-First Search) and generates graph data consisting of nodes (pages) and links (references). This data is then rendered in 3D space with Three.js for interactive exploration.

---

## Key Features

- **3D Interactive** — Real-time 3D rendering with Three.js. Drag, zoom, and pan to explore freely
- **Dual Layouts** — Switch between Force-Directed 3D and Hierarchical Tree 3D with a single click
- **Streaming** — Real-time crawl progress display. Stop button for mid-crawl interruption
- **InstancedMesh Optimization** — Smooth rendering for 1000+ nodes via GPU instancing
- **JSON Import/Export** — Drag & drop graph.json to visualize. Paste JSON or export files
- **Cloudflare Worker** — Serverless crawler. CORS bypass for universal access

---

## Prerequisites

| Tool | Minimum Version | Check Command |
|---|---:|---|
| Node.js | >= 18 | `node --version` |
| Wrangler | >= 3 | `wrangler --version` |
| Python 3 | optional (for Viewer simple server) | `python3 --version` |

---

## Getting Started

### Worker Setup

```bash
cd worker
npm install
wrangler dev
# → http://localhost:8787
```

### Viewer Setup

```bash
cd viewer
python3 -m http.server 8080
# → http://localhost:8080/viewer/index.html
```

### Astro LP Setup

```bash
cd astro
npm install
npm run dev
# → http://localhost:4321
```

---

## Usage

1. Enter a URL and click "Start Crawl"
2. Visualize the link structure in 3D graph
3. Switch between Force-Directed 3D and Hierarchical Tree 3D
4. Click a node to view details (path from root, related links)
5. Click "Export JSON" to download graph data

---

## API

### POST /api/crawl

Starts a crawl and returns a streaming response with progress updates.

```json
{
  "url": "https://example.com",
  "depth": 2,
  "sameOriginOnly": true
}
```

Response (streaming):

```json
{ "type": "progress", "progress": { "current": 1, "total": 5, "message": "Fetched: ..." } }
{ "type": "complete", "data": { "startUrl": "...", "nodes": [...], "links": [...] } }
```

### GET /api/session?id=

Returns the current session status.

### POST /api/session?id=

Stops the session.

---

## Known Limitations

- The crawler only extracts links from **static HTML `<a href>` tags**. Links generated dynamically by JavaScript (SPA / client-side rendering) **cannot be detected**.
  - Example: `watanabe3ti.com` is a JS-rendered site, so it produces 0 links (expected behavior).
  - In that case, the viewer shows a warning.
- A single-page result may contain only 1 node.

---

## Tech Stack

| Layer | Technology |
|----------|------|
| Client | Astro + Three.js + InstancedMesh |
| Server | Cloudflare Worker + Durable Objects |
| Crawler | cheerio |
| Build | Wrangler (Worker) + Astro Build |

---

## Repository Structure

```
gg/
├── worker/          # Cloudflare Worker API
├── viewer/          # Three.js 3D Viewer
├── astro/           # Astro LP
├── DEV-MEMO.md      # Development Notes
├── LICENSE
└── README.md
```

---

## Contributing

Contributions are welcome. For major changes, please open an issue first.

Basic workflow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your change'`)
4. Push the branch and create a Pull Request

---

## Deployment

### GitHub Pages

1. Go to GitHub repo Settings → Pages
2. Source: Select GitHub Actions
3. Auto-deploys on push

### Cloudflare Pages

1. Cloudflare Dashboard → Pages → Create a project
2. Connect repository `watanabe3tipapa/gg`
3. Build command: `npm run build` (root package.json. Runs Astro build, copies to `dist`, and strips the `/gg` base)
4. Build output directory: `dist`
5. See: `https://gg-7sj.pages.dev/`

### Worker API

```bash
cd worker
npm install
npx wrangler deploy
# → https://gg-worker.watanabe3ti.workers.dev
```

---

## License

MIT License — See LICENSE file for details.

---

## Development Status

- Repository is not archived.
- Last updated: 2026-09-05
