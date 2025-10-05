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

	async extractLatestData(): Promise<JGIGenomeProject[]> {
		try {
			// Extract both archaea and bacteria genomes
			const [archaeaData, bacteriaData] = await Promise.all([
				this.extractGenomesForDomain("archaea"),
				this.extractGenomesForDomain("bacteria"),
			]);

			const allProjects = [...archaeaData, ...bacteriaData];

			// Cache the latest extraction timestamp
			await this.env.METADATA_CACHE.put(
				"last_extraction",
				new Date().toISOString(),
				{ expirationTtl: 86400 }, // 24 hours
			);

			return allProjects;
		} catch (error) {
			console.error("JGI extraction failed:", error);
			throw error;
		}
	}

	private async extractGenomesForDomain(
		domain: "archaea" | "bacteria",
		maxPages: number = 10, // Limit to 10 pages to avoid timeouts
	): Promise<JGIGenomeProject[]> {
		const projects: JGIGenomeProject[] = [];
		let currentPage = 0;
		let hasMore = true;
		const pageSize = 100; // Request 100 organisms per page

		try {
			while (hasMore && currentPage < maxPages) {
				const startIndex = currentPage * pageSize;
				const searchUrl = `${this.baseUrl}/search/?q=${domain}+genome&superseded=Current&dataset_type=Finished+Genome&start=${startIndex}&rows=${pageSize}`;

				console.log(
					`Fetching ${domain} genomes page ${currentPage + 1}/${maxPages} from: ${searchUrl}`,
				);

				const response = await fetch(searchUrl, {
					headers: {
						"User-Agent": "MicrobeMetrics/1.0 (genomes.kenflynn.dev)",
						Accept: "application/json",
					},
				});

				console.log(
					`JGI API response status for ${domain} page ${currentPage + 1}: ${response.status}`,
				);

				if (!response.ok) {
					throw new Error(`JGI API error: ${response.status} ${response.statusText}`);
				}

				const data = await response.json();

				const totalAvailable = data.total || 0;
				const organismCount = data.organisms?.length || 0;

				console.log(`JGI API page ${currentPage + 1} response:`, {
					organismCount,
					totalAvailable,
					hasOrganisms: !!data.organisms,
					startIndex,
					endIndex: startIndex + organismCount,
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
				const fetchedSoFar = startIndex + organismCount;
				hasMore = organismCount > 0 && fetchedSoFar < totalAvailable;
				currentPage++;

				// Add small delay between requests to be respectful to JGI API
				if (hasMore && currentPage < maxPages) {
					await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
				}
			}

			console.log(
				`Successfully extracted ${projects.length} ${domain} genomes across ${currentPage} pages`,
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
		// The organism object from JGI has a different structure
		// Log first organism to see structure
		if (!organism.name && !organism.organism_name) {
			console.warn("Organism missing name:", JSON.stringify(organism).substring(0, 200));
			return null;
		}

		const organismName = organism.organism_name || organism.name || "Unknown";
		const metadata = this.parseOrganismMetadata(organismName, domain);

		const project: JGIGenomeProject = {
			id: organism.organism_id?.toString() || organism.id?.toString() || Math.random().toString(),
			name: organismName,
			organism: organismName,
			sequenceType: "Genome Assembly",
			status: "available",
			submissionDate: organism.added_date || new Date().toISOString(),
			releaseDate: organism.release_date,
			sequenceLength: organism.est_size,
			geneCount: organism.gene_count,
			metadata: {
				...metadata,
				phylum: organism.phylum,
				class: organism.class_name,
				order: organism.order_name,
				family: organism.family,
				genus: organism.genus,
				species: organism.species,
				strain: organism.strain,
			},
			urls: {
				portal: organism.portal_url || `https://genome.jgi.doe.gov/portal/${organism.organism_id}`,
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
