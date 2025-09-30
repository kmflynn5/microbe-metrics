/**
 * Microbe Metrics API Worker
 * Handles all backend API endpoints for genomics analytics
 */

import { JGIDataExtractor } from "./jgi-extractor";
import { R2StorageManager } from "./storage-manager";
import { AnalyticsProcessor } from "./analytics-processor";
import { EvidenceGenerator } from "./evidence-generator";

// Cloudflare Worker runtime types
interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  blob(): Promise<Blob>;
}

interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    cacheExpiry?: Date;
  };
  customMetadata?: Record<string, string>;
}

interface R2ListOptions {
  prefix?: string;
  delimiter?: string;
  cursor?: string;
  limit?: number;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

interface KVNamespace {
  get(key: string, options?: { type?: "text" | "json" | "arrayBuffer" | "stream" }): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number; expiration?: number; metadata?: any }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string; expiration?: number; metadata?: any }[]; list_complete: boolean; cursor?: string }>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

interface AnalyticsEngineDataset {
  writeDataPoint(event?: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface Env {
  GENOMICS_DATA: R2Bucket;
  METADATA_CACHE: KVNamespace;
  ANALYTICS_PROCESSOR?: DurableObjectNamespace;  // Optional - for future use
  ANALYTICS?: AnalyticsEngineDataset;  // Optional - for future use
  ENVIRONMENT: string;
  LOG_LEVEL: string;
}

export class MicrobeMetricsAPI {
  private env: Env;
  private jgiExtractor: JGIDataExtractor;
  private storageManager: R2StorageManager;
  private evidenceGenerator: EvidenceGenerator;

  constructor(env: Env) {
    this.env = env;
    this.jgiExtractor = new JGIDataExtractor(env);
    this.storageManager = new R2StorageManager(env);
    this.evidenceGenerator = new EvidenceGenerator(env);
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route API requests
      if (path.startsWith("/api/")) {
        const response = await this.routeApi(path, request);
        return this.addCorsHeaders(response, corsHeaders);
      }

      return this.jsonResponse(
        { error: "Not found", success: false, timestamp: new Date().toISOString() },
        404,
        corsHeaders
      );
    } catch (error) {
      console.error("API Error:", error);
      return this.jsonResponse(
        {
          error: error instanceof Error ? error.message : "Internal server error",
          success: false,
          timestamp: new Date().toISOString(),
        },
        500,
        corsHeaders
      );
    }
  }

  private async routeApi(path: string, request: Request): Promise<Response> {
    // Health check
    if (path === "/api/health") {
      return this.handleHealth();
    }

    // Analytics endpoints
    if (path === "/api/analytics/overview") {
      return this.handleAnalyticsOverview();
    }

    if (path === "/api/analytics/trends") {
      return this.handleTrends();
    }

    if (path === "/api/analytics/pipeline-health") {
      return this.handlePipelineHealth();
    }

    if (path === "/api/analytics/recent-activity") {
      return this.handleRecentActivity();
    }

    // Metadata endpoints
    if (path === "/api/metadata/latest") {
      return this.handleLatestMetadata();
    }

    if (path === "/api/metadata/search") {
      return this.handleMetadataSearch(request);
    }

    // Pipeline control
    if (path === "/api/pipeline/status") {
      return this.handlePipelineStatus();
    }

    if (path === "/api/pipeline/trigger" && request.method === "POST") {
      return this.handleTriggerExtraction();
    }

    // Evidence/Reports
    if (path === "/api/reports/generate" && request.method === "POST") {
      return this.handleGenerateReport();
    }

    return this.jsonResponse(
      { error: "Endpoint not found", success: false, timestamp: new Date().toISOString() },
      404
    );
  }

  // Health check endpoint
  private async handleHealth(): Promise<Response> {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: this.env.ENVIRONMENT || "development",
    };

    return this.jsonResponse({ data: health, success: true, timestamp: health.timestamp });
  }

  // Analytics overview with key metrics
  private async handleAnalyticsOverview(): Promise<Response> {
    try {
      // Try to get cached overview
      const cached = await this.env.METADATA_CACHE.get("analytics_overview");
      if (cached) {
        const data = JSON.parse(cached);
        return this.jsonResponse({ data, success: true, timestamp: new Date().toISOString() });
      }

      // Generate fresh overview (this would be populated by scheduled extraction)
      const overview = {
        totalProjects: 0,
        archaeaProjects: 0,
        bacteriaProjects: 0,
        lastUpdated: new Date().toISOString(),
        growthRate: 0,
        newProjectsThisWeek: 0,
      };

      // Cache for 1 hour
      await this.env.METADATA_CACHE.put("analytics_overview", JSON.stringify(overview), {
        expirationTtl: 3600,
      });

      return this.jsonResponse({ data: overview, success: true, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      throw error;
    }
  }

  // Trends data for visualizations
  private async handleTrends(): Promise<Response> {
    const cached = await this.env.METADATA_CACHE.get("analytics_trends");
    if (cached) {
      const data = JSON.parse(cached);
      return this.jsonResponse({ data, success: true, timestamp: new Date().toISOString() });
    }

    const trends = {
      daily: [],
      monthly: [],
      yearly: [],
    };

    return this.jsonResponse({ data: trends, success: true, timestamp: new Date().toISOString() });
  }

  // Pipeline health status
  private async handlePipelineHealth(): Promise<Response> {
    const stats = await this.jgiExtractor.getExtractionStats();

    const health = {
      status: "healthy" as const,
      lastExtraction: stats.lastExtraction,
      extractionCount: stats.totalProjects,
      errorRate: 0,
      avgProcessingTime: 0,
      uptime: 99.9,
    };

    return this.jsonResponse({ data: health, success: true, timestamp: new Date().toISOString() });
  }

  // Recent activity log
  private async handleRecentActivity(): Promise<Response> {
    const cached = await this.env.METADATA_CACHE.get("recent_activity");
    if (cached) {
      const data = JSON.parse(cached);
      return this.jsonResponse({ data, success: true, timestamp: new Date().toISOString() });
    }

    const activities = [];
    return this.jsonResponse({ data: activities, success: true, timestamp: new Date().toISOString() });
  }

  // Latest metadata
  private async handleLatestMetadata(): Promise<Response> {
    const projects = await this.storageManager.getLatestMetadata();
    return this.jsonResponse({ data: projects, success: true, timestamp: new Date().toISOString() });
  }

  // Search metadata
  private async handleMetadataSearch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";

    if (!query) {
      return this.jsonResponse(
        { error: "Query parameter 'q' is required", success: false, timestamp: new Date().toISOString() },
        400
      );
    }

    const results = await this.storageManager.searchMetadata(query);

    return this.jsonResponse({
      data: {
        projects: results,
        totalCount: results.length,
        query,
        searchTime: 0.1,
      },
      success: true,
      timestamp: new Date().toISOString(),
    });
  }

  // Pipeline status
  private async handlePipelineStatus(): Promise<Response> {
    const lastExtraction = await this.jgiExtractor.getLastExtractionTime();

    const status = {
      isRunning: false,
      lastRun: lastExtraction,
      nextScheduledRun: this.getNextCronTime(),
      status: "idle",
    };

    return this.jsonResponse({ data: status, success: true, timestamp: new Date().toISOString() });
  }

  // Trigger manual extraction
  private async handleTriggerExtraction(): Promise<Response> {
    // This would typically be authenticated/authorized
    try {
      const projects = await this.jgiExtractor.extractLatestData();
      await this.storageManager.storeRawData(projects);

      return this.jsonResponse({
        data: { message: "Extraction triggered successfully", projectsExtracted: projects.length },
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Extraction failed:", error);
      throw error;
    }
  }

  // Generate evidence report
  private async handleGenerateReport(): Promise<Response> {
    try {
      const report = await this.evidenceGenerator.generateAnalyticsReport();

      return this.jsonResponse({
        data: { report, message: "Report generated successfully" },
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Report generation failed:", error);
      throw error;
    }
  }

  // Utility: Get next cron execution time
  private getNextCronTime(): string {
    const now = new Date();
    const tomorrow6am = new Date(now);
    tomorrow6am.setUTCHours(6, 0, 0, 0);

    if (now.getUTCHours() >= 6) {
      tomorrow6am.setUTCDate(tomorrow6am.getUTCDate() + 1);
    }

    return tomorrow6am.toISOString();
  }

  // Utility: JSON response helper
  private jsonResponse(data: any, status: number = 200, extraHeaders: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
    });
  }

  // Utility: Add CORS headers to response
  private addCorsHeaders(response: Response, corsHeaders: Record<string, string>): Response {
    const newResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    return newResponse;
  }
}

// Scheduled handler for cron trigger
export async function handleScheduled(env: Env): Promise<void> {
  console.log("Starting scheduled JGI data extraction...");

  try {
    const extractor = new JGIDataExtractor(env);
    const storageManager = new R2StorageManager(env);

    // Extract latest data from JGI
    const projects = await extractor.extractLatestData();
    console.log(`Extracted ${projects.length} genome projects`);

    // Store in R2
    await storageManager.storeRawData(projects);
    console.log("Projects stored successfully");

    // Generate analytics
    const analyticsProcessor = new AnalyticsProcessor(env);
    const analytics = await analyticsProcessor.processAnalytics(projects);
    console.log("Analytics processed");

    // Cache analytics overview
    await env.METADATA_CACHE.put("analytics_overview", JSON.stringify(analytics.overview), {
      expirationTtl: 86400, // 24 hours
    });

    // Log activity
    const activity = {
      id: crypto.randomUUID(),
      type: "extraction",
      status: "success",
      message: `Daily JGI data extraction completed`,
      timestamp: new Date().toISOString(),
      metadata: { projectsProcessed: projects.length },
    };

    const recentActivity = [activity];
    await env.METADATA_CACHE.put("recent_activity", JSON.stringify(recentActivity), {
      expirationTtl: 86400,
    });

    console.log("Scheduled extraction completed successfully");
  } catch (error) {
    console.error("Scheduled extraction failed:", error);
    throw error;
  }
}