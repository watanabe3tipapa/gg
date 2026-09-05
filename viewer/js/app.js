// app.js — gg メインコントローラ

import { GraphRenderer } from './graph-renderer.js';
import { LayoutForce3D } from './layout-force3d.js';
import { LayoutTree3D } from './layout-tree3d.js';
import { Controls } from './controls.js';
import { Panel } from './panel.js';

class GGApp {
  constructor() {
    this.renderer = new GraphRenderer('graph-container', 'graph-canvas');
    this.layouts = {
      force3d: new LayoutForce3D(),
      tree3d: new LayoutTree3D(),
    };
    this.currentLayout = 'force3d';
    this.controls = new Controls(this.renderer, this);
    this.panel = new Panel(this);
    this.currentData = null;
    this.sessionId = null;

    this.initTabs();
    this.initCrawlForm();
    this.initJsonInput();
    this.initDemoForm();
    this.initLayoutSwitch();
    this.initActions();
  }

  initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ['crawl', 'json', 'demo'].forEach(t => {
          document.getElementById(`panel-${t}`).style.display = btn.dataset.tab === t ? 'block' : 'none';
        });
      });
    });
  }

  initCrawlForm() {
    document.getElementById('crawl-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = this.normalizeUrl(document.getElementById('crawl-url').value.trim());
      const depth = parseInt(document.getElementById('crawl-depth').value, 10);
      if (!url) return;

      this.showStatus('クロールを開始しています...');
      document.getElementById('btn-stop').style.display = 'inline-flex';

      try {
        const API_BASE = 'https://gg-worker.watanabe3ti.workers.dev';
        const response = await fetch(`${API_BASE}/api/crawl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, depth, sameOriginOnly: true }),
        });

        this.sessionId = response.headers.get('X-Session-Id');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split('\n').filter(Boolean);
          for (const line of lines) {
            const event = JSON.parse(line);
            if (event.type === 'progress') {
              this.updateProgress(event.progress);
            } else if (event.type === 'complete') {
              this.renderGraph(event.data);
            } else if (event.type === 'error') {
              this.showError(event.error);
            }
          }
        }
      } catch (err) {
        this.showError(err.message);
      } finally {
        document.getElementById('btn-stop').style.display = 'none';
      }
    });
  }

  initJsonInput() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.loadJsonFile(file);
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) this.loadJsonFile(e.target.files[0]);
    });

    document.getElementById('json-btn').addEventListener('click', () => {
      const input = document.getElementById('json-input').value.trim();
      if (!input) return;
      try {
        const data = JSON.parse(input);
        this.renderGraph(data);
      } catch (err) {
        this.showError('JSONパース失敗: ' + err.message);
      }
    });
  }

  initDemoForm() {
    document.getElementById('demo-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('demo-url').value.trim();
      const depth = parseInt(document.getElementById('demo-depth').value, 10);
      if (!url) return;

      this.showStatus('デモデータを生成中...');
      await this.delay(800);

      const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const startUrl = 'https://' + domain;
      const data = this.generateMockData(startUrl, depth);
      this.renderGraph(data);
    });
  }

  initLayoutSwitch() {
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentLayout = btn.dataset.layout;
        if (this.currentData) {
          this.applyLayout(this.currentData);
        }
      });
    });
  }

  initActions() {
    document.getElementById('btn-stop').addEventListener('click', async () => {
      if (this.sessionId) {
        await fetch(`https://gg-worker.watanabe3ti.workers.dev/api/session?id=${this.sessionId}`, { method: 'POST' });
        this.showStatus('停止しました');
        document.getElementById('btn-stop').style.display = 'none';
      }
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      this.renderer.reset();
      this.panel.close();
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      if (!this.currentData) return;
      const blob = new Blob([JSON.stringify(this.currentData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graph.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('panel-close').addEventListener('click', () => {
      this.panel.close();
      this.renderer.resetHighlight();
    });
  }

  renderGraph(data) {
    this.currentData = data;
    document.getElementById('graph-title').textContent = this.shortenUrl(data.startUrl);
    document.getElementById('graph-section').classList.add('active');
    this.hideStatus();
    this.updateStats(data);
    this.applyLayout(data);
    setTimeout(() => {
      document.getElementById('graph-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  applyLayout(data) {
    const layout = this.layouts[this.currentLayout];
    const positions = layout.compute(data);
    this.renderer.render(data, positions);
  }

  updateStats(data) {
    const total = data.nodes.length;
    const maxDepth = total ? Math.max(...data.nodes.map(n => n.depth ?? 0)) : 0;
    const orphans = data.nodes.filter(n => !data.links.some(l =>
      (l.source === n.id || l.target === n.id)
    )).length;
    document.getElementById('stats-bar').innerHTML = `
      <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">ページ</div></div>
      <div class="stat-card"><div class="stat-value">${data.links.length}</div><div class="stat-label">リンク</div></div>
      <div class="stat-card"><div class="stat-value">${maxDepth}</div><div class="stat-label">最大深度</div></div>
      <div class="stat-card"><div class="stat-value">${total ? (data.links.length / total).toFixed(1) : '0.0'}</div><div class="stat-label">平均次数</div></div>
      <div class="stat-card"><div class="stat-value">${orphans}</div><div class="stat-label">孤立ノード</div></div>
    `;
  }

  showStatus(msg) {
    document.getElementById('status-bar').classList.add('visible');
    document.getElementById('status-text').innerHTML = `<b>${msg}</b>`;
  }

  hideStatus() {
    document.getElementById('status-bar').classList.remove('visible');
  }

  updateProgress(progress) {
    document.getElementById('status-text').innerHTML =
      `<b>${progress.message}</b> (${progress.current}/${progress.total})`;
  }

  showError(msg) {
    this.hideStatus();
    alert('エラー: ' + msg);
  }

  loadJsonFile(file) {
    if (!file.name.endsWith('.json')) {
      alert('JSONファイルを選択してください');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.nodes || !data.links) throw new Error('nodes と links が必要です');
        data.startUrl = data.startUrl || data.nodes[0]?.id || 'unknown';
        this.renderGraph(data);
      } catch (err) {
        this.showError('JSONのパースに失敗: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  generateMockData(startUrl, maxDepth) {
    const nodes = [], links = [];
    const paths = [
      '/', '/about', '/blog', '/products', '/research', '/careers', '/contact',
      '/blog/announcing-llm', '/blog/graph-view', '/blog/ai-research-2024',
      '/products/haiku', '/products/namazu', '/products/evolutionary-ml',
      '/research/papers', '/research/datasets', '/research/collaborations',
      '/careers/engineer', '/careers/researcher', '/careers/designer',
    ];
    const depthMap = {};
    paths.forEach(p => {
      const segs = p.split('/').filter(Boolean);
      depthMap[startUrl + p] = p === '/' ? 0 : Math.min(segs.length, 3);
    });
    paths.forEach(p => {
      const id = startUrl + p;
      if ((depthMap[id] || 0) > maxDepth) return;
      const segs = p.split('/').filter(Boolean);
      const label = p === '/' ? 'Home' : segs[segs.length - 1].replace(/-/g, ' ');
      nodes.push({ id, label: label.charAt(0).toUpperCase() + label.slice(1), depth: depthMap[id] || 0 });
    });
    const nodeIds = new Set(nodes.map(n => n.id));
    const addLink = (s, t) => { if (nodeIds.has(s) && nodeIds.has(t)) links.push({ source: s, target: t }); };
    addLink(startUrl + '/', startUrl + '/about');
    addLink(startUrl + '/', startUrl + '/blog');
    addLink(startUrl + '/', startUrl + '/products');
    addLink(startUrl + '/', startUrl + '/research');
    addLink(startUrl + '/', startUrl + '/careers');
    addLink(startUrl + '/', startUrl + '/contact');
    addLink(startUrl + '/blog', startUrl + '/blog/announcing-llm');
    addLink(startUrl + '/blog', startUrl + '/blog/graph-view');
    addLink(startUrl + '/blog', startUrl + '/blog/ai-research-2024');
    addLink(startUrl + '/products', startUrl + '/products/haiku');
    addLink(startUrl + '/products', startUrl + '/products/namazu');
    addLink(startUrl + '/products', startUrl + '/products/evolutionary-ml');
    addLink(startUrl + '/research', startUrl + '/research/papers');
    addLink(startUrl + '/research', startUrl + '/research/datasets');
    addLink(startUrl + '/research', startUrl + '/research/collaborations');
    addLink(startUrl + '/careers', startUrl + '/careers/engineer');
    addLink(startUrl + '/careers', startUrl + '/careers/researcher');
    addLink(startUrl + '/careers', startUrl + '/careers/designer');
    addLink(startUrl + '/blog/announcing-llm', startUrl + '/products/namazu');
    addLink(startUrl + '/blog/graph-view', startUrl + '/research/datasets');
    return { startUrl, nodes, links };
  }

  shortenUrl(url) {
    try { const u = new URL(url); return u.pathname === '/' ? u.hostname : u.hostname + u.pathname; }
    catch { return url; }
  }

  normalizeUrl(url) {
    return /^https?:\/\//i.test(url) ? url : 'https://' + url;
  }

  delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

window.addEventListener('DOMContentLoaded', () => new GGApp());
