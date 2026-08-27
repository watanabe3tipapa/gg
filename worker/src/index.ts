// index.ts — gg Worker メイン

import { Env } from './types';
export { CrawlSession } from './session';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // API routing
    if (url.pathname === '/api/crawl') {
      return this.handleCrawl(request, env);
    }

    if (url.pathname === '/api/session') {
      return this.handleSession(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },

  async handleCrawl(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const { url, depth = 2, sameOriginOnly = true, sessionId } = await request.json<{
        url: string;
        depth?: number;
        sameOriginOnly?: boolean;
        sessionId?: string;
      }>();

      if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create or get session
      const id = sessionId || crypto.randomUUID();
      const doId = env.CRAWL_SESSION.idFromName(id);
      const stub = env.CRAWL_SESSION.get(doId);

      // Start crawl with streaming
      const crawlRequest = new Request('https://internal/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, depth, sameOriginOnly }),
      });

      const response = await stub.fetch(crawlRequest);

      // Add CORS headers
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('X-Session-Id', id);

      return newResponse;
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },

  async handleSession(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('id');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const doId = env.CRAWL_SESSION.idFromName(sessionId);
    const stub = env.CRAWL_SESSION.get(doId);

    if (request.method === 'GET') {
      const statusRequest = new Request('https://internal/status');
      const response = await stub.fetch(statusRequest);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      return newResponse;
    }

    if (request.method === 'POST') {
      const stopRequest = new Request('https://internal/stop', { method: 'POST' });
      const response = await stub.fetch(stopRequest);
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      return newResponse;
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};
