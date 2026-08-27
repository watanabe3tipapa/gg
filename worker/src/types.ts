// types.ts — gg 共通型定義

export interface GraphNode {
  id: string;
  label: string;
  depth: number;
  origin: string;
  pathname: string;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  startUrl: string;
  crawledAt: string;
  config: {
    maxDepth: number;
    sameOriginOnly: boolean;
  };
  stats: {
    nodes: number;
    links: number;
    maxDepth: number;
    fetched: number;
    failed: number;
  };
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface CrawlRequest {
  url: string;
  depth: number;
  sameOriginOnly?: boolean;
  sessionId?: string;
}

export interface CrawlResponse {
  type: 'progress' | 'complete' | 'error';
  data?: GraphData;
  error?: string;
  progress?: {
    current: number;
    total: number;
    message: string;
  };
}

export interface Env {
  CRAWL_SESSION: DurableObjectNamespace;
}

export interface SessionState {
  id: string;
  url: string;
  maxDepth: number;
  status: 'pending' | 'running' | 'stopped' | 'completed' | 'error';
  nodes: GraphNode[];
  links: GraphLink[];
  visited: Record<string, number>;
  queue: Array<{ url: string; depth: number; from: string | null }>;
  fetched: number;
  failed: number;
}
