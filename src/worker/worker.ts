/**
 * Microbe Metrics Cloudflare Worker Entry Point
 * Handles API requests and scheduled data extraction
 */

import { MicrobeMetricsAPI, handleScheduled, type Env } from "./api";

// Cloudflare Worker types
interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

export default {
  /**
   * Fetch handler - processes all HTTP requests
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname.startsWith("/api/")) {
      const api = new MicrobeMetricsAPI(env);
      return api.handleRequest(request);
    }

    // For non-API requests, return a simple response
    // (SvelteKit pages are served separately via Cloudflare Pages)
    return new Response("Microbe Metrics API", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },

  /**
   * Scheduled handler - runs on cron trigger (daily at 6 AM UTC)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  },
};

// Export types for use in other files
export type { Env };