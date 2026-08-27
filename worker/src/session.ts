// session.ts — Durable Object（セッション管理）

import { DurableObject } from 'cloudflare:workers';
import { crawlDepth, createGraphData } from './crawler';
import { SessionState, GraphData } from './types';

export class CrawlSession extends DurableObject {
  private state: SessionState | null = null;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/start') {
      return this.handleStart(request);
    } else if (url.pathname === '/stop') {
      return this.handleStop();
    } else if (url.pathname === '/status') {
      return this.handleStatus();
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleStart(request: Request): Promise<Response> {
    const { url, depth, sameOriginOnly } = await request.json<{
      url: string;
      depth: number;
      sameOriginOnly?: boolean;
    }>();

    this.state = {
      id: this.ctx.id.toString(),
      url,
      maxDepth: depth,
      status: 'running',
      nodes: [],
      links: [],
      visited: {},
      queue: [{ url, depth: 0, from: null }],
      fetched: 0,
      failed: 0,
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          for (let d = 0; d <= depth; d++) {
            if (this.state?.status === 'stopped') {
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'stopped' }) + '\n'));
              break;
            }

            const result = await crawlDepth(url, d, sameOriginOnly ?? true, (progress) => {
              controller.enqueue(
                encoder.encode(JSON.stringify({ type: 'progress', progress }) + '\n')
              );
            });

            this.state.nodes.push(...result.nodes);
            this.state.links.push(...result.links);
            this.state.fetched += result.fetched;
            this.state.failed += result.failed;
          }

          if (this.state?.status !== 'stopped') {
            this.state.status = 'completed';
            const graphData = createGraphData(
              url,
              depth,
              sameOriginOnly ?? true,
              this.state.nodes,
              this.state.links,
              this.state.fetched,
              this.state.failed
            );
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'complete', data: graphData }) + '\n'));
          }
        } catch (err) {
          this.state.status = 'error';
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'error', error: String(err) }) + '\n')
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  private handleStop(): Response {
    if (this.state) {
      this.state.status = 'stopped';
    }
    return new Response(JSON.stringify({ status: 'stopped' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private handleStatus(): Response {
    if (!this.state) {
      return new Response(JSON.stringify({ status: 'idle' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        status: this.state.status,
        nodes: this.state.nodes.length,
        links: this.state.links.length,
        fetched: this.state.fetched,
        failed: this.state.failed,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
