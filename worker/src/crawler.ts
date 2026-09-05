// crawler.ts — BFS クロールロジック

import * as cheerio from 'cheerio';
import { URL } from 'node:url';
import { GraphNode, GraphLink, GraphData } from './types';

const SKIP_PATTERNS = [
  /\.(pdf|zip|tar\.gz|tgz|rar|7z|exe|dmg|apk|deb|rpm)$/i,
  /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff?)$/i,
  /\.(mp4|mp3|avi|mov|wmv|flv|mkv|m4a|ogg|wav)$/i,
  /\.(css|scss|less|sass)$/i,
  /\.(js|mjs|jsx|ts|tsx)$/i,
  /\.(woff2?|ttf|otf|eot)$/i,
  /\.(xml|json|rss|atom)$/i,
  /^(mailto|tel|javascript):/i,
  /#/,
];

function shouldSkip(url: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(url));
}

function labelFromUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    if (u.pathname === '/') return u.hostname;
    const segs = u.pathname.split('/').filter(Boolean);
    const last = segs[segs.length - 1] || '';
    return last
      .replace(/[-_]/g, ' ')
      .replace(/\.html?$/, '')
      .replace(/^\w/, c => c.toUpperCase())
      || u.hostname;
  } catch {
    return urlStr;
  }
}

function normalizeUrl(urlStr: string, base: string): string | null {
  try {
    const abs = new URL(urlStr, base).href;
    const u = new URL(abs);
    u.hash = '';
    if (u.pathname !== '/' && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch {
    return null;
  }
}

export async function crawlDepth(
  url: string,
  depth: number,
  sameOriginOnly: boolean,
  onProgress?: (progress: { current: number; total: number; message: string }) => void,
  shouldStop?: () => boolean
): Promise<{ nodes: GraphNode[]; links: GraphLink[]; fetched: number; failed: number }> {
  const startUrl = ensureScheme(url);
  const startOrigin = new URL(startUrl).origin;
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const visited: Record<string, number> = {};
  const queue: Array<{ url: string; depth: number; from: string | null }> = [{ url: startUrl, depth: 0, from: null }];
  let fetched = 0;
  let failed = 0;

  while (queue.length > 0) {
    if (shouldStop?.()) break;

    const { url: currentUrl, depth: currentDepth, from } = queue.shift()!;

    if (currentDepth > depth) continue;
    if (visited[currentUrl] !== undefined) continue;
    if (shouldSkip(currentUrl)) continue;

    if (sameOriginOnly) {
      const origin = new URL(currentUrl).origin;
      if (origin !== startOrigin) continue;
    }

    visited[currentUrl] = currentDepth;
    nodes.push({
      id: currentUrl,
      label: labelFromUrl(currentUrl),
      depth: currentDepth,
      origin: new URL(currentUrl).origin,
      pathname: new URL(currentUrl).pathname,
    });

    if (from) {
      links.push({ source: from, target: currentUrl });
    }

    if (currentDepth >= depth) continue;

    try {
      const res = await fetch(currentUrl, {
        headers: {
          'User-Agent': 'gg-bot/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });

      fetched++;
      onProgress?.({
        current: fetched,
        total: queue.length,
        message: `Fetched: ${currentUrl}`,
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href || href.startsWith('#')) return;

        const abs = normalizeUrl(href, currentUrl);
        if (!abs) return;
        if (shouldSkip(abs)) return;

        links.push({ source: currentUrl, target: abs });

        const absOrigin = new URL(abs).origin;
        if (absOrigin === startOrigin && visited[abs] === undefined) {
          queue.push({ url: abs, depth: currentDepth + 1, from: currentUrl });
        }
      });
    } catch (err) {
      failed++;
    }
  }

  return { nodes, links, fetched, failed };
}

export function createGraphData(
  startUrl: string,
  maxDepth: number,
  sameOriginOnly: boolean,
  nodes: GraphNode[],
  links: GraphLink[],
  fetched: number,
  failed: number
): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  for (const n of nodes) {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
  }
  const uniqueNodes = [...nodeMap.values()];

  const linkSet = new Set<string>();
  const uniqueLinks: GraphLink[] = [];
  for (const l of links) {
    const key = `${l.source}->${l.target}`;
    if (!linkSet.has(key)) {
      linkSet.add(key);
      uniqueLinks.push(l);
    }
  }

  return {
    startUrl,
    crawledAt: new Date().toISOString(),
    config: { maxDepth, sameOriginOnly },
    stats: {
      nodes: uniqueNodes.length,
      links: uniqueLinks.length,
      maxDepth: Math.max(...uniqueNodes.map(n => n.depth), 0),
      fetched,
      failed,
    },
    nodes: uniqueNodes,
    links: uniqueLinks,
  };
}

export function ensureScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : 'https://' + url;
}
