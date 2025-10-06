/**
 * JGI Data Extractor - Handles communication with JGI Data Portal API
 */

import type { Env } from "./types";

export interface JGIGenomeProject {
	id: string;
	name: string;
	organism: string;
	sequenceType: string;
	status: string;
	submissionDate: string;
	releaseDate?: string;
	sequenceLength?: number;
	geneCount?: number;
	metadata: {
		domain: string;
		phylum?: string;
		class?: string;
		order?: string;
		family?: string;
		genus?: string;
		species?: string;
		strain?: string;
	};
	urls: {
		portal: string;
		download?: string;
	};
	extractedAt: string;
}

export class JGIDataExtractor {
	private env: Env;
	private baseUrl = "https://files.jgi.doe.gov";

	constructor(env: Env) {
		this.env = env;
	}

	async extractLatestData(fullExtraction: boolean = false): Promise<{
		projects: JGIGenomeProject[];
		stats: { newCount: number; updatedCount: number; totalCount: number };
	}> {
		try {
			console.log(`Starting ${fullExtraction ? "FULL" : "INCREMENTAL"} extraction from JGI API...`);

			// Determine how many pages to fetch
			const maxPages = fullExtraction ? 100 : 3; // Full: ~10k per domain, Incremental: 300 per domain

			// Extract both archaea and bacteria genomes
			const [archaeaData, bacteriaData] = await Promise.all([
				this.extractGenomesForDomain("archaea", maxPages),
				this.extractGenomesForDomain("bacteria", maxPages),
			]);

			const newProjects = [...archaeaData, ...bacteriaData];
			console.log(`Extracted ${newProjects.length} genomes from JGI API`);

			// Get master dataset from R2
			const storageManager = new (await import("./storage-manager")).R2StorageManager(this.env);
			const masterDataset = await storageManager.getMasterDataset();
			console.log(`Loaded ${masterDataset.length} genomes from master dataset`);

			// Merge and deduplicate
			const { merged, stats } = this.mergeAndDeduplicate(masterDataset, newProjects);
			console.log(
				`Merge complete: ${stats.totalCount} total (${stats.newCount} new, ${stats.updatedCount} updated)`,
			);

			// Store updated master dataset
			await storageManager.storeMasterDataset(merged, {
				newCount: stats.newCount,
				updatedCount: stats.updatedCount,
			});

			// Cache the latest extraction timestamp
			await this.env.METADATA_CACHE.put(
				"last_extraction",
				new Date().toISOString(),
				{ expirationTtl: 86400 }, // 24 hours
			);

			// Return only the newly extracted projects for activity logging
			return {
				projects: newProjects,
				stats,
			};
		} catch (error) {
			console.error("JGI extraction failed:", error);
			throw error;
		}
	}

	private mergeAndDeduplicate(
		masterDataset: JGIGenomeProject[],
		newProjects: JGIGenomeProject[],
	): {
		merged: JGIGenomeProject[];
		stats: { newCount: number; updatedCount: number; totalCount: number };
	} {
		// Create a map of existing projects by ID for fast lookup
		const projectMap = new Map<string, JGIGenomeProject>();
		masterDataset.forEach((project) => projectMap.set(project.id, project));

		let newCount = 0;
		let updatedCount = 0;

		// Merge new projects
		for (const newProject of newProjects) {
			const existing = projectMap.get(newProject.id);

			if (!existing) {
				// New genome
				projectMap.set(newProject.id, newProject);
				newCount++;
			} else {
				// Check if metadata has changed (organism updated, new gene count, etc.)
				const hasChanges =
					existing.sequenceLength !== newProject.sequenceLength ||
					existing.geneCount !== newProject.geneCount ||
					existing.status !== newProject.status ||
					JSON.stringify(existing.metadata) !== JSON.stringify(newProject.metadata);

				if (hasChanges) {
					// Update existing genome with new data
					projectMap.set(newProject.id, {
						...newProject,
						// Preserve original submission date
						submissionDate: existing.submissionDate,
					});
					updatedCount++;
				}
				// If no changes, keep existing entry (don't count as updated)
			}
		}

		const merged = Array.from(projectMap.values());

		return {
			merged,
			stats: {
				newCount,
				updatedCount,
				totalCount: merged.length,
			},
		};
	}

	private async extractGenomesForDomain(
		domain: "archaea" | "bacteria",
		maxPages: number = 100, // Fetch up to 10,000 genomes per domain (100 pages × 100 per page)
	): Promise<JGIGenomeProject[]> {
		const projects: JGIGenomeProject[] = [];
		let currentPage = 1; // JGI pagination starts at 1, not 0
		let hasMore = true;
		const pageSize = 100; // Request 100 organisms per page

		try {
			while (hasMore && currentPage <= maxPages) {
				// Use correct JGI pagination: x (items per page), p (page number starting at 1)
				const searchUrl = `${this.baseUrl}/search/?q=${domain}&x=${pageSize}&p=${currentPage}`;

				console.log(
					`Fetching ${domain} genomes page ${currentPage}/${maxPages} from: ${searchUrl}`,
				);

				const response = await fetch(searchUrl, {
					headers: {
						"User-Agent": "MicrobeMetrics/1.0 (genomes.kenflynn.dev)",
						Accept: "application/json",
					},
				});

				console.log(
					`JGI API response status for ${domain} page ${currentPage}: ${response.status}`,
				);

				if (!response.ok) {
					throw new Error(`JGI API error: ${response.status} ${response.statusText}`);
				}

				const data = await response.json();

				const totalAvailable = data.total || 0;
				const organismCount = data.organisms?.length || 0;

				console.log(`JGI API page ${currentPage} response:`, {
					organismCount,
					totalAvailable,
					hasOrganisms: !!data.organisms,
					page: currentPage,
				});

				// The JGI API returns organisms, not results
				if (data.organisms && Array.isArray(data.organisms)) {
					for (const organism of data.organisms) {
						try {
							const project = await this.processOrganismResult(organism, domain);
							if (project) {
								projects.push(project);
							}
						} catch (error) {
							console.warn("Failed to process organism result:", error);
							// Continue with other results
						}
					}
				} else {
					console.warn(`No organisms array found in JGI response for ${domain}`);
					hasMore = false;
					break;
				}

				// Check if there are more pages
				// Continue if we got results and haven't reached the total
				const fetchedSoFar = currentPage * pageSize;
				hasMore = organismCount > 0 && fetchedSoFar < totalAvailable;
				currentPage++;

				// Add small delay between requests to be respectful to JGI API
				if (hasMore && currentPage <= maxPages) {
					await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
				}
			}

			console.log(
				`Successfully extracted ${projects.length} ${domain} genomes across ${currentPage - 1} pages`,
			);
			return projects;
		} catch (error) {
			console.error(`Failed to extract ${domain} genomes:`, error);
			return projects; // Return what we got so far
		}
	}

	private async processOrganismResult(
		organism: any,
		domain: string,
	): Promise<JGIGenomeProject | null> {
		// JGI API uses 'id' and 'name' fields (not organism_id, organism_name)
		if (!organism.name && !organism.id) {
			console.warn("Organism missing required fields:", JSON.stringify(organism).substring(0, 200));
			return null;
		}

		const organismName = organism.name || "Unknown";
		const organismId = organism.id?.toString() || Math.random().toString();
		const metadata = this.parseOrganismMetadata(organismName, domain);

		const project: JGIGenomeProject = {
			id: organismId,
			name: organismName,
			organism: organismName,
			sequenceType: organism.label || "Genome Assembly",
			status: "available",
			submissionDate:
				organism.proposal_acceptance_date ||
				organism.work_completion_date ||
				new Date().toISOString(),
			releaseDate: organism.work_completion_date,
			sequenceLength: organism.fileSize,
			geneCount: organism.file_total,
			metadata: {
				...metadata,
				// Use available taxonomy fields if present
				phylum: organism.phylum,
				class: organism.class_name,
				order: organism.order_name,
				family: organism.family,
				genus: organism.genus,
				species: organism.species,
				strain: organism.strain,
			},
			urls: {
				portal: `https://genome.jgi.doe.gov/portal/${organismId}`,
				download: organism.download_url,
			},
			extractedAt: new Date().toISOString(),
		};

		return project;
	}

	private extractOrganismName(filename: string, label?: string): string {
		// Extract organism name from filename patterns
		const cleanName = (label || filename)
			.replace(/[_.]/g, " ")
			.replace(/\d+/g, "")
			.replace(/\s+/g, " ")
			.trim();

		// Common genome file patterns
		const patterns = [
			/([A-Z][a-z]+\s+[a-z]+)/, // Genus species
			/([A-Z][a-z]+)/, // Genus only
		];

		for (const pattern of patterns) {
			const match = cleanName.match(pattern);
			if (match) {
				return match[1];
			}
		}

		return cleanName.split(" ").slice(0, 2).join(" ") || "Unknown organism";
	}

	private parseOrganismMetadata(organism: string, domain: string) {
		const parts = organism.split(" ");
		const genus = parts[0];
		const species = parts[1];

		return {
			domain: domain.charAt(0).toUpperCase() + domain.slice(1),
			genus: genus || undefined,
			species: species || undefined,
			// Additional taxonomic information would need external API calls
			// which we'll implement in future iterations
		};
	}

	private extractSequenceType(result: any): string {
		const filename = result.filename?.toLowerCase() || "";

		if (filename.includes("scaffold")) return "Scaffolds";
		if (filename.includes("contig")) return "Contigs";
		if (filename.includes("chromosome")) return "Chromosome";
		if (filename.includes("plasmid")) return "Plasmid";

		return "Genome Assembly";
	}

	private async enrichProjectMetadata(project: JGIGenomeProject, result: any): Promise<void> {
		// This would make additional API calls to get detailed metadata
		// For now, we'll use what's available in the search result

		if (result.organism_name) {
			project.organism = result.organism_name;
		}

		if (result.file_size) {
			project.sequenceLength = parseInt(result.file_size);
		}

		// Estimate gene count based on sequence length (rough approximation)
		if (project.sequenceLength) {
			// Typical bacterial genome: 1 gene per ~1000 bp
			project.geneCount = Math.round(project.sequenceLength / 1000);
		}
	}

	async getLastExtractionTime(): Promise<string | null> {
		return (await this.env.METADATA_CACHE.get("last_extraction", {
			type: "text",
		})) as string | null;
	}

	async getExtractionStats(): Promise<{
		lastExtraction: string | null;
		totalProjects: number;
		archaeaProjects: number;
		bacteriaProjects: number;
	}> {
		const lastExtraction = await this.getLastExtractionTime();

		// Get counts from stored data
		const overview = await this.getStoredOverview();

		return {
			lastExtraction,
			totalProjects: overview?.totalProjects || 0,
			archaeaProjects: overview?.archaeaProjects || 0,
			bacteriaProjects: overview?.bacteriaProjects || 0,
		};
	}

	private async getStoredOverview(): Promise<any> {
		try {
			const cached = (await this.env.METADATA_CACHE.get("analytics_overview", {
				type: "text",
			})) as string | null;
			return cached ? JSON.parse(cached) : null;
		} catch {
			return null;
		}
	}
}
