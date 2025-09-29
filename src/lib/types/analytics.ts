/**
 * TypeScript interfaces for genomics analytics data models
 */

export interface GenomeProject {
  id: string;
  name: string;
  organism: string;
  sequenceType: string;
  status: string;
  submissionDate: string;
  releaseDate?: string;
  sequenceLength?: number;
  geneCount?: number;
  metadata: OrganismMetadata;
  urls: ProjectUrls;
  extractedAt: string;
}

export interface OrganismMetadata {
  domain: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  strain?: string;
}

export interface ProjectUrls {
  portal: string;
  download?: string;
}

export interface AnalyticsOverview {
  totalProjects: number;
  archaeaProjects: number;
  bacteriaProjects: number;
  lastUpdated: string;
  growthRate: number;
  newProjectsThisWeek: number;
}

export interface TrendData {
  daily: TrendPoint[];
  monthly: TrendPoint[];
  yearly: TrendPoint[];
}

export interface TrendPoint {
  date?: string;
  month?: string;
  year?: string;
  count: number;
  domain: string;
}

export interface PipelineHealth {
  status: "healthy" | "warning" | "error";
  lastExtraction: string;
  extractionCount: number;
  errorRate: number;
  avgProcessingTime: number;
  uptime: number;
}

export interface ActivityItem {
  id: string;
  type: "extraction" | "processing" | "analysis";
  status: "success" | "error" | "warning";
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  trends: TrendData;
  pipelineHealth: PipelineHealth;
  recentActivity: ActivityItem[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface SearchResult {
  projects: GenomeProject[];
  totalCount: number;
  query: string;
  searchTime: number;
}

// Component prop types
export interface AnalyticsOverviewProps {
  data: AnalyticsOverview;
  loading?: boolean;
  error?: string;
}

export interface PipelineHealthProps {
  data: PipelineHealth;
  loading?: boolean;
  error?: string;
}

export interface RecentActivityProps {
  data: ActivityItem[];
  loading?: boolean;
  error?: string;
}

export interface TrendsChartProps {
  data: TrendData;
  loading?: boolean;
  error?: string;
  timeframe: "daily" | "monthly" | "yearly";
}

// DuckDB query result types
export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export interface DuckDBConfig {
  bundles: {
    mvp: {
      mainModule: string;
      mainWorker: string;
    };
    eh: {
      mainModule: string;
      mainWorker: string;
    };
  };
}

// Evidence MD types
export interface EvidenceReport {
  type: string;
  title: string;
  content: string;
  generatedAt: string;
  metadata?: {
    totalProjects?: number;
    timeRange?: string;
    analysisType?: string;
  };
}

// Chart data types for D3.js visualizations
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
  borderWidth?: number;
}

export interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

export interface TimeSeriesPoint {
  date: Date;
  value: number;
  category: string;
}

// Filter and search types
export interface SearchFilters {
  domain?: string[];
  organism?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sequenceType?: string[];
  status?: string[];
}

export interface SortConfig {
  field: keyof GenomeProject;
  direction: "asc" | "desc";
}

// Error handling types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: ApiError;
  lastUpdated?: string;
}

// Store types for Svelte stores
export interface AnalyticsStore {
  overview: AnalyticsOverview | null;
  trends: TrendData | null;
  pipelineHealth: PipelineHealth | null;
  recentActivity: ActivityItem[];
  loading: LoadingState;
}

export interface ProjectStore {
  projects: GenomeProject[];
  filteredProjects: GenomeProject[];
  searchQuery: string;
  filters: SearchFilters;
  sort: SortConfig;
  loading: LoadingState;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    totalItems: number;
  };
}
