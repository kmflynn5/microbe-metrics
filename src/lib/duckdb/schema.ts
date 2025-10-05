/**
 * DuckDB Analytics Schema and Query Utilities
 */

import * as duckdb from "@duckdb/duckdb-wasm";
import type { GenomeProject, QueryResult } from "../types/analytics";

export class DuckDBAnalytics {
	private db: duckdb.AsyncDuckDB | null = null;
	private connection: duckdb.AsyncDuckDBConnection | null = null;

	async initialize(): Promise<void> {
		if (this.db) return;

		try {
			// Initialize DuckDB with browser-compatible bundle
			const bundle = await duckdb.selectBundle({
				mvp: {
					mainModule: "/node_modules/@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm",
					mainWorker: "/node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js",
				},
				eh: {
					mainModule: "/node_modules/@duckdb/duckdb-wasm/dist/duckdb-eh.wasm",
					mainWorker: "/node_modules/@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js",
				},
			});

			const worker = await duckdb.createWorker(bundle.mainWorker!);
			const logger = new duckdb.ConsoleLogger();
			this.db = new duckdb.AsyncDuckDB(logger, worker);
			await this.db.instantiate(bundle.mainModule);

			this.connection = await this.db.connect();

			// Create analytics schema
			await this.createSchema();

			console.log("DuckDB initialized successfully");
		} catch (error) {
			console.error("Failed to initialize DuckDB:", error);
			throw error;
		}
	}

	private async createSchema(): Promise<void> {
		if (!this.connection) throw new Error("DuckDB not initialized");

		// Create genome projects table
		await this.connection.query(`
      CREATE TABLE IF NOT EXISTS genome_projects (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        organism VARCHAR NOT NULL,
        sequence_type VARCHAR,
        status VARCHAR,
        submission_date TIMESTAMP,
        release_date TIMESTAMP,
        sequence_length BIGINT,
        gene_count INTEGER,
        domain VARCHAR,
        phylum VARCHAR,
        class VARCHAR,
        order_name VARCHAR,
        family VARCHAR,
        genus VARCHAR,
        species VARCHAR,
        strain VARCHAR,
        portal_url VARCHAR,
        download_url VARCHAR,
        extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

		// Create indexes for better query performance
		await this.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_domain ON genome_projects(domain);
    `);

		await this.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_submission_date ON genome_projects(submission_date);
    `);

		await this.connection.query(`
      CREATE INDEX IF NOT EXISTS idx_organism ON genome_projects(organism);
    `);

		// Create analytics views
		await this.createAnalyticsViews();
	}

	private async createAnalyticsViews(): Promise<void> {
		if (!this.connection) return;

		// Domain distribution view
		await this.connection.query(`
      CREATE OR REPLACE VIEW domain_distribution AS
      SELECT
        domain,
        COUNT(*) as project_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM genome_projects
      GROUP BY domain
      ORDER BY project_count DESC
    `);

		// Daily trends view
		await this.connection.query(`
      CREATE OR REPLACE VIEW daily_trends AS
      SELECT
        DATE_TRUNC('day', submission_date) as date,
        domain,
        COUNT(*) as submissions
      FROM genome_projects
      WHERE submission_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', submission_date), domain
      ORDER BY date DESC, domain
    `);

		// Monthly trends view
		await this.connection.query(`
      CREATE OR REPLACE VIEW monthly_trends AS
      SELECT
        DATE_TRUNC('month', submission_date) as month,
        domain,
        COUNT(*) as submissions
      FROM genome_projects
      GROUP BY DATE_TRUNC('month', submission_date), domain
      ORDER BY month DESC, domain
    `);

		// Organism statistics view
		await this.connection.query(`
      CREATE OR REPLACE VIEW organism_stats AS
      SELECT
        genus,
        species,
        domain,
        COUNT(*) as genome_count,
        AVG(sequence_length) as avg_genome_size,
        AVG(gene_count) as avg_gene_count
      FROM genome_projects
      WHERE genus IS NOT NULL AND species IS NOT NULL
      GROUP BY genus, species, domain
      HAVING COUNT(*) >= 2
      ORDER BY genome_count DESC
    `);

		// Recent activity view
		await this.connection.query(`
      CREATE OR REPLACE VIEW recent_submissions AS
      SELECT
        id,
        name,
        organism,
        domain,
        submission_date,
        sequence_length,
        gene_count
      FROM genome_projects
      WHERE submission_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY submission_date DESC
      LIMIT 50
    `);
	}

	async loadData(projects: GenomeProject[]): Promise<void> {
		if (!this.connection) throw new Error("DuckDB not initialized");

		// Clear existing data
		await this.connection.query("DELETE FROM genome_projects");

		// Prepare batch insert
		const insertStatement = await this.connection.prepare(`
      INSERT INTO genome_projects (
        id, name, organism, sequence_type, status, submission_date,
        release_date, sequence_length, gene_count, domain, phylum,
        class, order_name, family, genus, species, strain,
        portal_url, download_url, extracted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		// Insert projects in batches
		const batchSize = 100;
		for (let i = 0; i < projects.length; i += batchSize) {
			const batch = projects.slice(i, i + batchSize);

			for (const project of batch) {
				await insertStatement.query(
					project.id,
					project.name,
					project.organism,
					project.sequenceType,
					project.status,
					project.submissionDate,
					project.releaseDate || null,
					project.sequenceLength || null,
					project.geneCount || null,
					project.metadata.domain,
					project.metadata.phylum || null,
					project.metadata.class || null,
					project.metadata.order || null,
					project.metadata.family || null,
					project.metadata.genus || null,
					project.metadata.species || null,
					project.metadata.strain || null,
					project.urls.portal,
					project.urls.download || null,
					project.extractedAt,
				);
			}
		}

		await insertStatement.close();
		console.log(`Loaded ${projects.length} projects into DuckDB`);
	}

	async executeQuery(sql: string): Promise<QueryResult> {
		if (!this.connection) throw new Error("DuckDB not initialized");

		const startTime = performance.now();

		try {
			const result = await this.connection.query(sql);
			const endTime = performance.now();

			return {
				columns: result.schema.fields.map((f) => f.name),
				rows: result.toArray().map((row) => Object.values(row)),
				rowCount: result.numRows,
				executionTime: endTime - startTime,
			};
		} catch (error) {
			console.error("Query execution failed:", error);
			throw error;
		}
	}

	// Predefined analytics queries
	async getDomainDistribution(): Promise<QueryResult> {
		return this.executeQuery("SELECT * FROM domain_distribution");
	}

	async getDailyTrends(): Promise<QueryResult> {
		return this.executeQuery("SELECT * FROM daily_trends ORDER BY date DESC LIMIT 30");
	}

	async getMonthlyTrends(): Promise<QueryResult> {
		return this.executeQuery("SELECT * FROM monthly_trends ORDER BY month DESC LIMIT 12");
	}

	async getOrganismStats(): Promise<QueryResult> {
		return this.executeQuery("SELECT * FROM organism_stats LIMIT 50");
	}

	async getRecentSubmissions(): Promise<QueryResult> {
		return this.executeQuery("SELECT * FROM recent_submissions");
	}

	async searchProjects(query: string): Promise<QueryResult> {
		const searchQuery = `
      SELECT id, name, organism, domain, submission_date, sequence_length, gene_count
      FROM genome_projects
      WHERE
        LOWER(name) LIKE LOWER('%${query}%') OR
        LOWER(organism) LIKE LOWER('%${query}%') OR
        LOWER(genus) LIKE LOWER('%${query}%') OR
        LOWER(species) LIKE LOWER('%${query}%')
      ORDER BY submission_date DESC
      LIMIT 100
    `;

		return this.executeQuery(searchQuery);
	}

	async getProjectsByDomain(domain: string): Promise<QueryResult> {
		return this.executeQuery(`
      SELECT id, name, organism, genus, species, submission_date, sequence_length, gene_count
      FROM genome_projects
      WHERE domain = '${domain}'
      ORDER BY submission_date DESC
      LIMIT 100
    `);
	}

	async getGenomeStats(): Promise<QueryResult> {
		return this.executeQuery(`
      SELECT
        domain,
        COUNT(*) as total_genomes,
        AVG(sequence_length) as avg_genome_size,
        MIN(sequence_length) as min_genome_size,
        MAX(sequence_length) as max_genome_size,
        AVG(gene_count) as avg_gene_count,
        MIN(gene_count) as min_gene_count,
        MAX(gene_count) as max_gene_count
      FROM genome_projects
      WHERE sequence_length IS NOT NULL AND gene_count IS NOT NULL
      GROUP BY domain
    `);
	}

	async getTaxonomyBreakdown(): Promise<QueryResult> {
		return this.executeQuery(`
      SELECT
        domain,
        phylum,
        class,
        COUNT(*) as project_count
      FROM genome_projects
      WHERE phylum IS NOT NULL AND class IS NOT NULL
      GROUP BY domain, phylum, class
      HAVING COUNT(*) >= 5
      ORDER BY project_count DESC
      LIMIT 50
    `);
	}

	async getGrowthAnalysis(): Promise<QueryResult> {
		return this.executeQuery(`
      SELECT
        DATE_TRUNC('month', submission_date) as month,
        COUNT(*) as new_projects,
        LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', submission_date)) as prev_month,
        ROUND(
          (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', submission_date)))
          * 100.0 / LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', submission_date)),
          2
        ) as growth_rate
      FROM genome_projects
      GROUP BY DATE_TRUNC('month', submission_date)
      ORDER BY month DESC
      LIMIT 12
    `);
	}

	async close(): Promise<void> {
		if (this.connection) {
			await this.connection.close();
			this.connection = null;
		}
		if (this.db) {
			await this.db.terminate();
			this.db = null;
		}
	}
}
