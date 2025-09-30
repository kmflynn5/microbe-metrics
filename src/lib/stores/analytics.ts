/**
 * Svelte stores for analytics data management
 */

import { writable, derived } from "svelte/store";
import type {
  AnalyticsOverview,
  TrendData,
  PipelineHealth,
  ActivityItem,
  GenomeProject,
  LoadingState,
  ApiError,
} from "../types/analytics";
import { apiClient, isApiError } from "../api/client";

// Loading state store
export const createLoadingStore = () => {
  const { subscribe, update } = writable<LoadingState>({
    isLoading: false,
    error: undefined,
    lastUpdated: undefined,
  });

  return {
    subscribe,
    setLoading: (loading: boolean) =>
      update((state) => ({ ...state, isLoading: loading })),
    setError: (error: ApiError | undefined) =>
      update((state) => ({ ...state, error, isLoading: false })),
    setSuccess: () =>
      update((state) => ({
        ...state,
        isLoading: false,
        error: undefined,
        lastUpdated: new Date().toISOString(),
      })),
  };
};

// Analytics Overview Store
function createAnalyticsOverviewStore() {
  const { subscribe, set } = writable<AnalyticsOverview | null>(null);
  const loading = createLoadingStore();

  return {
    subscribe,
    loading: loading.subscribe,
    async fetch() {
      loading.setLoading(true);

      try {
        const response = await apiClient.getAnalyticsOverview();

        if (isApiError(response)) {
          loading.setError({
            code: "FETCH_ERROR",
            message: response.error || "Failed to fetch analytics overview",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        set(response.data);
        loading.setSuccess();
      } catch (error) {
        loading.setError({
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Network error occurred",
          timestamp: new Date().toISOString(),
        });
      }
    },
    set,
  };
}

// Trends Store
function createTrendsStore() {
  const { subscribe, set } = writable<TrendData | null>(null);
  const loading = createLoadingStore();

  return {
    subscribe,
    loading: loading.subscribe,
    async fetch() {
      loading.setLoading(true);

      try {
        const response = await apiClient.getTrends();

        if (isApiError(response)) {
          loading.setError({
            code: "FETCH_ERROR",
            message: response.error || "Failed to fetch trends data",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        set(response.data);
        loading.setSuccess();
      } catch (error) {
        loading.setError({
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Network error occurred",
          timestamp: new Date().toISOString(),
        });
      }
    },
    set,
  };
}

// Pipeline Health Store
function createPipelineHealthStore() {
  const { subscribe, set } = writable<PipelineHealth | null>(null);
  const loading = createLoadingStore();

  return {
    subscribe,
    loading: loading.subscribe,
    async fetch() {
      loading.setLoading(true);

      try {
        const response = await apiClient.getPipelineHealth();

        if (isApiError(response)) {
          loading.setError({
            code: "FETCH_ERROR",
            message: response.error || "Failed to fetch pipeline health",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        set(response.data);
        loading.setSuccess();
      } catch (error) {
        loading.setError({
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Network error occurred",
          timestamp: new Date().toISOString(),
        });
      }
    },
    set,
  };
}

// Recent Activity Store
function createRecentActivityStore() {
  const { subscribe, set } = writable<ActivityItem[]>([]);
  const loading = createLoadingStore();

  return {
    subscribe,
    loading: loading.subscribe,
    async fetch() {
      loading.setLoading(true);

      try {
        const response = await apiClient.getRecentActivity();

        if (isApiError(response)) {
          loading.setError({
            code: "FETCH_ERROR",
            message: response.error || "Failed to fetch recent activity",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        set(response.data);
        loading.setSuccess();
      } catch (error) {
        loading.setError({
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Network error occurred",
          timestamp: new Date().toISOString(),
        });
      }
    },
    set,
  };
}

// Projects Store
function createProjectsStore() {
  const { subscribe, set } = writable<GenomeProject[]>([]);
  const loading = createLoadingStore();
  const searchQuery = writable<string>("");

  return {
    subscribe,
    loading: loading.subscribe,
    searchQuery: searchQuery.subscribe,
    async fetch() {
      loading.setLoading(true);

      try {
        const response = await apiClient.getLatestMetadata();

        if (isApiError(response)) {
          loading.setError({
            code: "FETCH_ERROR",
            message: response.error || "Failed to fetch projects",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        set(response.data);
        loading.setSuccess();
      } catch (error) {
        loading.setError({
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Network error occurred",
          timestamp: new Date().toISOString(),
        });
      }
    },
    async search(query: string) {
      searchQuery.set(query);

      if (!query.trim()) {
        await this.fetch();
        return;
      }

      loading.setLoading(true);

      try {
        const response = await apiClient.searchMetadata(query);

        if (isApiError(response)) {
          loading.setError({
            code: "SEARCH_ERROR",
            message: response.error || "Search failed",
            timestamp: new Date().toISOString(),
          });
          return;
        }

        set(response.data.projects);
        loading.setSuccess();
      } catch (error) {
        loading.setError({
          code: "NETWORK_ERROR",
          message:
            error instanceof Error ? error.message : "Network error occurred",
          timestamp: new Date().toISOString(),
        });
      }
    },
    setSearchQuery: searchQuery.set,
    set,
  };
}

// Export store instances
export const analyticsOverview = createAnalyticsOverviewStore();
export const trends = createTrendsStore();
export const pipelineHealth = createPipelineHealthStore();
export const recentActivity = createRecentActivityStore();
export const projects = createProjectsStore();

// Combined analytics store
export const analytics = derived(
  [analyticsOverview, trends, pipelineHealth, recentActivity],
  ([$overview, $trends, $health, $activity]) => ({
    overview: $overview,
    trends: $trends,
    pipelineHealth: $health,
    recentActivity: $activity,
  }),
);

// Global loading state
export const isLoading = derived(
  [analyticsOverview, trends, pipelineHealth, recentActivity, projects],
  () => {
    // This would need to be implemented based on the actual loading state structure
    // For now, we'll return false
    return false;
  },
);

// Utility function to refresh all data
export async function refreshAllData() {
  await Promise.all([
    analyticsOverview.fetch(),
    trends.fetch(),
    pipelineHealth.fetch(),
    recentActivity.fetch(),
    projects.fetch(),
  ]);
}

// Auto-refresh functionality
export function startAutoRefresh(intervalMs: number = 300000) {
  // 5 minutes default
  const interval = setInterval(() => {
    refreshAllData();
  }, intervalMs);

  return () => clearInterval(interval);
}
