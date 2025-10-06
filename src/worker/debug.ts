/**
 * Debug utilities for local development
 * These endpoints are only available when ENVIRONMENT=development
 */

import type { Env } from "./types";

export class DebugUtilities {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	/**
	 * Check if debug mode is enabled
	 */
	isDebugEnabled(): boolean {
		return this.env.ENVIRONMENT === "development";
	}

	/**
	 * List all KV namespace keys
	 */
	async listKVKeys(): Promise<Response> {
		if (!this.isDebugEnabled()) {
			return this.forbiddenResponse();
		}

		try {
			const keys = await this.env.METADATA_CACHE.list();
			return this.jsonResponse({
				data: {
					keys: keys.keys.map((k) => ({
						name: k.name,
						expiration: k.expiration,
						metadata: k.metadata,
					})),
					count: keys.keys.length,
					list_complete: keys.list_complete,
				},
				success: true,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error listing KV keys:", error);
			throw error;
		}
	}

	/**
	 * Get a specific KV value
	 */
	async getKVValue(key: string): Promise<Response> {
		if (!this.isDebugEnabled()) {
			return this.forbiddenResponse();
		}

		try {
			const value = await this.env.METADATA_CACHE.get(key, { type: "json" });
			return this.jsonResponse({
				data: {
					key,
					value,
				},
				success: true,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error(`Error getting KV value for key ${key}:`, error);
			throw error;
		}
	}

	/**
	 * List R2 bucket contents
	 */
	async listR2Objects(prefix?: string): Promise<Response> {
		if (!this.isDebugEnabled()) {
			return this.forbiddenResponse();
		}

		try {
			const listed = await this.env.GENOMICS_DATA.list({
				prefix: prefix || undefined,
				limit: 100,
			});

			return this.jsonResponse({
				data: {
					objects: listed.objects.map((obj) => ({
						key: obj.key,
						size: obj.size,
						etag: obj.etag,
					})),
					count: listed.objects.length,
					truncated: listed.truncated,
					cursor: listed.cursor,
				},
				success: true,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error listing R2 objects:", error);
			throw error;
		}
	}

	/**
	 * Get an R2 object
	 */
	async getR2Object(key: string): Promise<Response> {
		if (!this.isDebugEnabled()) {
			return this.forbiddenResponse();
		}

		try {
			const object = await this.env.GENOMICS_DATA.get(key);
			if (!object) {
				return this.jsonResponse(
					{
						error: `Object not found: ${key}`,
						success: false,
						timestamp: new Date().toISOString(),
					},
					404,
				);
			}

			const data = await object.json();
			return this.jsonResponse({
				data: {
					key,
					size: object.size,
					content: data,
				},
				success: true,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error(`Error getting R2 object ${key}:`, error);
			throw error;
		}
	}

	/**
	 * Get debug info about the worker environment
	 */
	async getDebugInfo(): Promise<Response> {
		if (!this.isDebugEnabled()) {
			return this.forbiddenResponse();
		}

		return this.jsonResponse({
			data: {
				environment: this.env.ENVIRONMENT,
				logLevel: this.env.LOG_LEVEL,
				bindings: {
					hasR2: !!this.env.GENOMICS_DATA,
					hasKV: !!this.env.METADATA_CACHE,
					hasAnalytics: !!this.env.ANALYTICS,
					hasDurableObjects: !!this.env.ANALYTICS_PROCESSOR,
				},
			},
			success: true,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Trigger manual extraction (incremental or full)
	 * GET /api/debug/trigger?full=true for full extraction
	 */
	async triggerExtraction(fullExtraction: boolean = false): Promise<Response> {
		if (!this.isDebugEnabled()) {
			return this.forbiddenResponse();
		}

		try {
			const { handleScheduled } = await import("./api");

			// Trigger extraction asynchronously (fire and forget)
			handleScheduled(this.env, fullExtraction).catch((error) => {
				console.error("Extraction failed:", error);
			});

			return this.jsonResponse({
				data: {
					message: `${fullExtraction ? "Full" : "Incremental"} extraction triggered`,
					type: fullExtraction ? "full" : "incremental",
					estimatedTime: fullExtraction ? "2-3 minutes" : "30-60 seconds",
				},
				success: true,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			return this.jsonResponse(
				{
					error: error instanceof Error ? error.message : "Extraction trigger failed",
					success: false,
					timestamp: new Date().toISOString(),
				},
				500,
			);
		}
	}

	private forbiddenResponse(): Response {
		return this.jsonResponse(
			{
				error: "Debug endpoints only available in development environment",
				success: false,
				timestamp: new Date().toISOString(),
			},
			403,
		);
	}

	private jsonResponse(
		data: unknown,
		status: number = 200,
		headers: Record<string, string> = {},
	): Response {
		return new Response(JSON.stringify(data), {
			status,
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
		});
	}
}
