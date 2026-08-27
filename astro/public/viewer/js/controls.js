// controls.js — インタラクション制御

export class Controls {
  constructor(renderer, app) {
    this.renderer = renderer;
    this.app = app;
    this.tooltip = document.getElementById('tooltip');
    this.ttTitle = document.getElementById('tt-title');
    this.ttMeta = document.getElementById('tt-meta');

    this.renderer.onNodeHover = (node, e) => this.showTooltip(node, e);
    this.renderer.onNodeClick = (node) => this.app.panel.open(node);

    this.canvas = this.renderer.canvas;
    this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
  }

  showTooltip(node, e) {
    this.ttTitle.textContent = node.label;
    this.ttMeta.textContent = `${this.shortenUrl(node.id)} · 深度: ${node.depth ?? '-'}`;
    this.tooltip.classList.add('visible');
    this.moveTooltip(e);
  }

  moveTooltip(e) {
    const rect = this.canvas.getBoundingClientRect();
    let x = e.clientX - rect.left + 14;
    let y = e.clientY - rect.top + 14;
    if (x + 240 > rect.width) x = e.clientX - rect.left - 250;
    if (y + 70 > rect.height) y = e.clientY - rect.top - 80;
    this.tooltip.style.left = x + 'px';
    this.tooltip.style.top = y + 'px';
  }

  hideTooltip() {
    this.tooltip.classList.remove('visible');
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
