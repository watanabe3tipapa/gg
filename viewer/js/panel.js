// panel.js — サイドパネル

export class Panel {
  constructor(app) {
    this.app = app;
    this.panel = document.getElementById('side-panel');
    this.title = document.getElementById('panel-title');
    this.url = document.getElementById('panel-url');
    this.meta = document.getElementById('panel-meta');
    this.pathList = document.getElementById('panel-path');
    this.linksList = document.getElementById('panel-links');
  }

  open(node) {
    this.title.textContent = node.label;
    this.url.textContent = this.shortenUrl(node.id);
    this.url.href = node.id.startsWith('http') ? node.id : 'https://' + node.id;
    this.meta.innerHTML = `深度: <b>${node.depth ?? '-'}</b>`;

    this.renderPath(node);
    this.renderLinks(node);

    this.panel.classList.add('open');
  }

  close() {
    this.panel.classList.remove('open');
  }

  renderPath(node) {
    this.pathList.innerHTML = '';
    const path = this.shortestPath(node.id);
    path.forEach((id, i) => {
      const n = this.app.currentData.nodes.find(x => x.id === id);
      if (!n) return;
      const li = document.createElement('li');
      li.textContent = (i > 0 ? '→ ' : '') + n.label;
      li.style.paddingLeft = (i * 12) + 'px';
      li.onclick = () => {
        this.open(n);
        this.app.renderer.highlightNode(n);
      };
      this.pathList.appendChild(li);
    });
  }

  renderLinks(node) {
    this.linksList.innerHTML = '';
    const rels = new Set();
    this.app.currentData.links.forEach(l => {
      if (l.source === node.id) rels.add(l.target);
      if (l.target === node.id) rels.add(l.source);
    });
    rels.forEach(id => {
      const n = this.app.currentData.nodes.find(x => x.id === id);
      if (!n) return;
      const li = document.createElement('li');
      li.textContent = n.label;
      li.onclick = () => {
        this.open(n);
        this.app.renderer.highlightNode(n);
      };
      this.linksList.appendChild(li);
    });
  }

  shortestPath(targetId) {
    const data = this.app.currentData;
    if (!data) return [targetId];
    const start = data.startUrl || data.nodes[0]?.id;
    if (targetId === start) return [targetId];

    const adj = {};
    data.nodes.forEach(n => adj[n.id] = []);
    data.links.forEach(l => {
      adj[l.source]?.push(l.target);
      adj[l.target]?.push(l.source);
    });

    const q = [start];
    const prev = { [start]: null };
    while (q.length) {
      const cur = q.shift();
      if (cur === targetId) break;
      for (const nxt of (adj[cur] || [])) {
        if (!(nxt in prev)) {
          prev[nxt] = cur;
          q.push(nxt);
        }
      }
    }

    if (!(targetId in prev)) return [targetId];
    const path = [];
    let cur = targetId;
    while (cur) {
      path.unshift(cur);
      cur = prev[cur];
    }
    return path;
  }

  shortenUrl(url) {
    try {
      const u = new URL(url);
      return u.pathname === '/' ? u.hostname : u.hostname + u.pathname;
    } catch {
      return url;
    }
  }
}
