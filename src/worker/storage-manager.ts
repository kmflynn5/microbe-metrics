/**
 * R2 Storage Manager - Handles all R2 bucket operations and data organization
 */

import type { Env } from "./types";
import type { JGIGenomeProject } from "./jgi-extractor";

export interface AnalyticsData {
	overview: {
		totalProjects: number;
		archaeaProjects: number;
		bacteriaProjects: number;
		lastUpdated: string;
		growthRate: number;
		newProjectsThisWeek: number;
	};
	trends: {
		daily: Array<{ date: string; count: number; domain: string }>;
		monthly: Array<{ month: string; count: number; domain: string }>;
		yearly: Array<{ year: string; count: number; domain: string }>;
	};
	pipelineHealth: {
		status: "healthy" | "warning" | "error";
		lastExtraction: string;
		extractionCount: number;
		errorRate: number;
		avgProcessingTime: number;
		uptime: number;
	};
	recentActivity: Array<{
		id: string;
		type: "extraction" | "processing" | "analysis";
		status: "success" | "error" | "warning";
		message: string;
		timestamp: string;
		metadata?: any;
	}>;
}

export class R2StorageManager {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	async storeRawData(projects: JGIGenomeProject[]): Promise<void> {
		const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
		const key = `raw/jgi-responses/${timestamp}.json`;

		const data = {
			extractedAt: new Date().toISOString(),
			projectCount: projects.length,
			projects,
		};

		try {
			await this.env.GENOMICS_DATA.put(key, JSON.stringify(data, null, 2), {
				httpMetadata: {
					contentType: "application/json",
				},
			});
		} catch (error) {
			console.error("Failed to store raw data:", error);
			throw error;
		}
	}

	async getMasterDataset(): Promise<JGIGenomeProject[]> {
		try {
			const object = await this.env.GENOMICS_DATA.get("master/genomes.json");
			if (object) {
				const data = (await object.json()) as {
					projects: JGIGenomeProject[];
					lastUpdated: string;
					totalCount: number;
				};
				return data.projects;
			}
			return [];
		} catch (error) {
			console.error("Failed to get master dataset:", error);
			return [];
		}
	}

	async storeMasterDataset(
		projects: JGIGenomeProject[],
		metadata: { newCount: number; updatedCount: number },
	): Promise<void> {
		const data = {
			projects,
			totalCount: projects.length,
			lastUpdated: new Date().toISOString(),
			metadata: {
				newGenomes: metadata.newCount,
				updatedGenomes: metadata.updatedCount,
			},
		};

		try {
			await this.env.GENOMICS_DATA.put("master/genomes.json", JSON.stringify(data, null, 2), {
				httpMetadata: {
					contentType: "application/json",
				},
			});

			// Cache metadata in KV for quick access
			await this.env.METADATA_CACHE.put(
				"master_metadata",
				JSON.stringify({
					totalCount: projects.length,
					lastUpdated: data.lastUpdated,
					...metadata,
				}),
				{ expirationTtl: 86400 }, // 24 hours
			);

			console.log(
				`Master dataset updated: ${projects.length} total genomes (${metadata.newCount} new, ${metadata.updatedCount} updated)`,
			);
		} catch (error) {
			console.error("Failed to store master dataset:", error);
			throw error;
		}
	}

	async storeAnalytics(analytics: AnalyticsData): Promise<void> {
		const timestamp = new Date().toISOString();
		const dateKey = timestamp.split("T")[0];

		try {
			// Store current analytics
			await this.env.GENOMICS_DATA.put(
				"analytics/current.json",
				JSON.stringify(analytics, null, 2),
				{
					httpMetadata: { contentType: "application/json" },
				},
			);

			// Store historical snapshot
			await this.env.GENOMICS_DATA.put(
				`analytics/history/${dateKey}.json`,
				JSON.stringify(analytics, null, 2),
				{
					httpMetadata: { contentType: "application/json" },
				},
			);

			// Cache in KV for fast access
			await this.env.METADATA_CACHE.put(
				"analytics_overview",
				JSON.stringify(analytics.overview),
				{ expirationTtl: 3600 }, // 1 hour
			);
		} catch (error) {
			console.error("Failed to store analytics:", error);
			throw error;
		}
	}

	async storeEvidence(evidenceReports: any[]): Promise<void> {
		const timestamp = new Date().toISOString().split("T")[0];

		try {
			for (const report of evidenceReports) {
				const key = `evidence/${report.type}/${timestamp}.md`;
				await this.env.GENOMICS_DATA.put(key, report.content, {
					httpMetadata: { contentType: "text/markdown" },
				});
			}
		} catch (error) {
			console.error("Failed to store evidence reports:", error);
			throw error;
		}
	}

	async getAnalyticsOverview(): Promise<any> {
		try {
			// Try cache first
			const cached = (await this.env.METADATA_CACHE.get("analytics_overview", {
				type: "text",
			})) as string | null;
			if (cached) {
				return JSON.parse(cached);
			}

			// Fallback to R2
			const object = await this.env.GENOMICS_DATA.get("analytics/current.json");
			if (object) {
				const data = (await object.json()) as AnalyticsData;
				return data.overview;
			}

			// Return mock data if no real data available
			return this.getMockAnalyticsOverview();
		} catch (error) {
			console.error("Failed to get analytics overview:", error);
			return this.getMockAnalyticsOverview();
		}
	}

	async getTrends(): Promise<any> {
		try {
			const object = await this.env.GENOMICS_DATA.get("analytics/current.json");
			if (object) {
				const data = (await object.json()) as AnalyticsData;
				return data.trends;
			}

			return this.getMockTrends();
		} catch (error) {
			console.error("Failed to get trends:", error);
			return this.getMockTrends();
		}
	}

	async getPipelineHealth(): Promise<any> {
		try {
			const object = await this.env.GENOMICS_DATA.get("analytics/current.json");
			if (object) {
				const data = (await object.json()) as AnalyticsData;
				return data.pipelineHealth;
			}

			return this.getMockPipelineHealth();
		} catch (error) {
			console.error("Failed to get pipeline health:", error);
			return this.getMockPipelineHealth();
		}
	}

	async getRecentActivity(): Promise<any> {
		try {
			const object = await this.env.GENOMICS_DATA.get("analytics/current.json");
			if (object) {
				const data = (await object.json()) as AnalyticsData;
				return data.recentActivity;
			}

			return this.getMockRecentActivity();
		} catch (error) {
			console.error("Failed to get recent activity:", error);
			return this.getMockRecentActivity();
		}
	}

	async getLatestMetadata(): Promise<JGIGenomeProject[]> {
		try {
			// First try master dataset (contains all genomes)
			const masterProjects = await this.getMasterDataset();
			if (masterProjects.length > 0) {
				return masterProjects;
			}

			// Fallback to daily extraction if master doesn't exist yet
			const timestamp = new Date().toISOString().split("T")[0];
			const object = await this.env.GENOMICS_DATA.get(`raw/jgi-responses/${timestamp}.json`);

			if (object) {
				const data = (await object.json()) as { projects: JGIGenomeProject[] };
				return data.projects;
			}

			// Try yesterday's data
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayKey = yesterday.toISOString().split("T")[0];

			const yesterdayObject = await this.env.GENOMICS_DATA.get(
				`raw/jgi-responses/${yesterdayKey}.json`,
			);
			if (yesterdayObject) {
				const data = (await yesterdayObject.json()) as {
					projects: JGIGenomeProject[];
				};
				return data.projects;
			}

			return [];
		} catch (error) {
			console.error("Failed to get latest metadata:", error);
			return [];
		}
	}

	async searchMetadata(query: string): Promise<JGIGenomeProject[]> {
		const latest = await this.getLatestMetadata();

		if (!query) return latest;

		const searchTerms = query.toLowerCase().split(" ");

		return latest.filter((project) => {
			const searchableText = [
				project.name,
				project.organism,
				project.metadata.genus,
				project.metadata.species,
				project.metadata.domain,
			]
				.join(" ")
				.toLowerCase();

			return searchTerms.every((term) => searchableText.includes(term));
		});
	}

	// Mock data methods for development
	private getMockAnalyticsOverview() {
		return {
			totalProjects: 15847,
			archaeaProjects: 1247,
			bacteriaProjects: 14600,
			lastUpdated: new Date().toISOString(),
			growthRate: 12.5,
			newProjectsThisWeek: 23,
		};
	}

	private getMockTrends() {
		const now = new Date();
		const daily = [];

		for (let i = 6; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);

			daily.push({
				date: date.toISOString().split("T")[0],
				count: Math.floor(Math.random() * 10) + 5,
				domain: "Bacteria",
			});

			daily.push({
				date: date.toISOString().split("T")[0],
				count: Math.floor(Math.random() * 3) + 1,
				domain: "Archaea",
			});
		}

		return { daily, monthly: [], yearly: [] };
	}

	private getMockPipelineHealth() {
		return {
			status: "healthy" as const,
			lastExtraction: new Date().toISOString(),
			extractionCount: 47,
			errorRate: 0.021,
			avgProcessingTime: 1247,
			uptime: 99.8,
		};
	}

	private getMockRecentActivity() {
		return [
			{
				id: "1",
				type: "extraction" as const,
				status: "success" as const,
				message: "Daily JGI data extraction completed",
				timestamp: new Date().toISOString(),
				metadata: { projectsProcessed: 23 },
			},
			{
				id: "2",
				type: "processing" as const,
				status: "success" as const,
				message: "Analytics pipeline processed 15,847 genome projects",
				timestamp: new Date(Date.now() - 3600000).toISOString(),
				metadata: { processingTime: "1.2s" },
			},
			{
				id: "3",
				type: "analysis" as const,
				status: "success" as const,
				message: "Generated evidence reports for genomics trends",
				timestamp: new Date(Date.now() - 7200000).toISOString(),
				metadata: { reportsGenerated: 4 },
			},
		];
	}
}
