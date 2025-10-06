/**
 * API Client for Microbe Metrics Worker Communication
 */

import type {
	AnalyticsOverview,
	TrendData,
	PipelineHealth,
	ActivityItem,
	GenomeProject,
	SearchResult,
	ApiResponse,
	ApiError,
} from "../types/analytics";

export class MicrobeMetricsAPI {
	private baseUrl: string;
	private timeout: number;

	constructor(baseUrl: string = "/api", timeout: number = 10000) {
		this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
		this.timeout = timeout;
	}

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
		const url = `${this.baseUrl}${endpoint}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal,
				headers: {
					"Content-Type": "application/json",
					...options.headers,
				},
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
			}

			// Backend already returns ApiResponse<T> format
			// Return it directly without double-wrapping
			const data = await response.json();
			return data;
		} catch (error) {
			clearTimeout(timeoutId);

			const apiError: ApiError = {
				code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
				message: error instanceof Error ? error.message : "An unknown error occurred",
				timestamp: new Date().toISOString(),
			};

			return {
				data: null as T,
				success: false,
				error: apiError.message,
				timestamp: apiError.timestamp,
			};
		}
	}

	// Analytics endpoints
	async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsOverview>> {
		return this.request<AnalyticsOverview>("/analytics/overview");
	}

	async getTrends(): Promise<ApiResponse<TrendData>> {
		return this.request<TrendData>("/analytics/trends");
	}

	async getPipelineHealth(): Promise<ApiResponse<PipelineHealth>> {
		return this.request<PipelineHealth>("/analytics/pipeline-health");
	}

	async getRecentActivity(): Promise<ApiResponse<ActivityItem[]>> {
		return this.request<ActivityItem[]>("/analytics/recent-activity");
	}

	// Metadata endpoints
	async getLatestMetadata(): Promise<ApiResponse<GenomeProject[]>> {
		return this.request<GenomeProject[]>("/metadata/latest");
	}

	async searchMetadata(query: string): Promise<ApiResponse<SearchResult>> {
		const searchParams = new URLSearchParams({ q: query });
		return this.request<SearchResult>(`/metadata/search?${searchParams}`);
	}

	// Pipeline control endpoints
	async getPipelineStatus(): Promise<ApiResponse<any>> {
		return this.request<any>("/pipeline/status");
	}

	async triggerExtraction(): Promise<ApiResponse<any>> {
		return this.request<any>("/pipeline/trigger", {
			method: "POST",
		});
	}

	// Health check
	async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
		return this.request<{ status: string; timestamp: string }>("/health");
	}

	// Batch data loading (for development/testing)
	async loadTestData(projects: GenomeProject[]): Promise<ApiResponse<{ loaded: number }>> {
		return this.request<{ loaded: number }>("/dev/load-data", {
			method: "POST",
			body: JSON.stringify({ projects }),
		});
	}
}

// Singleton instance
// Both frontend (Pages) and worker are on genomes.kenflynn.dev
// So we can use relative URLs everywhere
export const api = new MicrobeMetricsAPI("/api");

// Utility functions for error handling
export function isApiError(
	response: ApiResponse<any>,
): response is ApiResponse<any> & { success: false } {
	return !response.success;
}

export function getErrorMessage(response: ApiResponse<any>): string {
	if (isApiError(response)) {
		return response.error || "An unexpected error occurred";
	}
	return "";
}

// Mock API for development when worker is not available
export class MockMicrobeMetricsAPI extends MicrobeMetricsAPI {
	constructor() {
		super();
	}

	async getAnalyticsOverview(): Promise<ApiResponse<AnalyticsOverview>> {
		await this.delay(500); // Simulate network delay

		return {
			data: {
				totalProjects: 15847,
				archaeaProjects: 1247,
				bacteriaProjects: 14600,
				lastUpdated: new Date().toISOString(),
				growthRate: 12.5,
				newProjectsThisWeek: 23,
			},
			success: true,
			timestamp: new Date().toISOString(),
		};
	}

	async getTrends(): Promise<ApiResponse<TrendData>> {
		await this.delay(300);

		const daily = this.generateMockDailyTrends();
		const monthly = this.generateMockMonthlyTrends();
		const yearly = this.generateMockYearlyTrends();

		return {
			data: { daily, monthly, yearly },
			success: true,
			timestamp: new Date().toISOString(),
		};
	}

	async getPipelineHealth(): Promise<ApiResponse<PipelineHealth>> {
		await this.delay(200);

		return {
			data: {
				status: "healthy" as const,
				lastExtraction: new Date().toISOString(),
				extractionCount: 47,
				errorRate: 0.021,
				avgProcessingTime: 1247,
				uptime: 99.8,
			},
			success: true,
			timestamp: new Date().toISOString(),
		};
	}

	async getRecentActivity(): Promise<ApiResponse<ActivityItem[]>> {
		await this.delay(250);

		return {
			data: [
				{
					id: "1",
					type: "extraction",
					status: "success",
					message: "Daily JGI data extraction completed",
					timestamp: new Date().toISOString(),
					metadata: { projectsProcessed: 23 },
				},
				{
					id: "2",
					type: "processing",
					status: "success",
					message: "Analytics pipeline processed 15,847 genome projects",
					timestamp: new Date(Date.now() - 3600000).toISOString(),
					metadata: { processingTime: "1.2s" },
				},
				{
					id: "3",
					type: "analysis",
					status: "success",
					message: "Generated evidence reports for genomics trends",
					timestamp: new Date(Date.now() - 7200000).toISOString(),
					metadata: { reportsGenerated: 4 },
				},
			],
			success: true,
			timestamp: new Date().toISOString(),
		};
	}

	async getLatestMetadata(): Promise<ApiResponse<GenomeProject[]>> {
		await this.delay(400);

		return {
			data: this.generateMockProjects(),
			success: true,
			timestamp: new Date().toISOString(),
		};
	}

	async searchMetadata(query: string): Promise<ApiResponse<SearchResult>> {
		await this.delay(300);

		const projects = this.generateMockProjects().filter(
			(p) =>
				p.organism.toLowerCase().includes(query.toLowerCase()) ||
				p.name.toLowerCase().includes(query.toLowerCase()),
		);

		return {
			data: {
				projects,
				totalCount: projects.length,
				query,
				searchTime: 0.3,
			},
			success: true,
			timestamp: new Date().toISOString(),
		};
	}

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private generateMockDailyTrends() {
		const trends = [];
		const now = new Date();

		for (let i = 6; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const dateStr = date.toISOString().split("T")[0];

			trends.push({
				date: dateStr,
				count: Math.floor(Math.random() * 10) + 5,
				domain: "Bacteria",
			});

			trends.push({
				date: dateStr,
				count: Math.floor(Math.random() * 3) + 1,
				domain: "Archaea",
			});
		}

		return trends;
	}

	private generateMockMonthlyTrends() {
		const trends = [];
		const now = new Date();

		for (let i = 11; i >= 0; i--) {
			const date = new Date(now);
			date.setMonth(date.getMonth() - i);
			const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

			trends.push({
				month: monthStr,
				count: Math.floor(Math.random() * 100) + 50,
				domain: "Bacteria",
			});

			trends.push({
				month: monthStr,
				count: Math.floor(Math.random() * 20) + 5,
				domain: "Archaea",
			});
		}

		return trends;
	}

	private generateMockYearlyTrends() {
		const trends = [];
		const currentYear = new Date().getFullYear();

		for (let year = currentYear - 4; year <= currentYear; year++) {
			trends.push({
				year: year.toString(),
				count: Math.floor(Math.random() * 1000) + 500,
				domain: "Bacteria",
			});

			trends.push({
				year: year.toString(),
				count: Math.floor(Math.random() * 200) + 50,
				domain: "Archaea",
			});
		}

		return trends;
	}

	private generateMockProjects(): GenomeProject[] {
		const organisms = [
			"Escherichia coli",
			"Pseudomonas aeruginosa",
			"Bacillus subtilis",
			"Methanococcus maripaludis",
			"Thermococcus kodakarensis",
			"Streptococcus pneumoniae",
		];

		return organisms.map((organism, index) => ({
			id: `jgi_${index + 1}`,
			name: `${organism} genome project`,
			organism,
			sequenceType: "Complete Genome",
			status: "available",
			submissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
			sequenceLength: Math.floor(Math.random() * 5000000) + 1000000,
			geneCount: Math.floor(Math.random() * 5000) + 1000,
			metadata: {
				domain: index > 2 ? "Archaea" : "Bacteria",
				genus: organism.split(" ")[0],
				species: organism.split(" ")[1],
			},
			urls: {
				portal: `https://files.jgi.doe.gov/file/${index + 1}`,
				download: `https://files-download.jgi.doe.gov/file/${index + 1}`,
			},
			extractedAt: new Date().toISOString(),
		}));
	}
}

// Always use real API in production
// In development, the worker runs at localhost:8787 alongside the frontend
export const apiClient = api;
