<script lang="ts">
	import { onMount } from 'svelte';
	import { analyticsOverview } from '../stores/analytics';
	import type { AnalyticsOverview } from '../types/analytics';

	let data: AnalyticsOverview | null = $state(null);
	let loading = $state(true);
	let error = $state<string | undefined>(undefined);

	// Subscribe to store
	analyticsOverview.subscribe(value => {
		data = value;
	});

	analyticsOverview.loading(loadingState => {
		loading = loadingState.isLoading;
		error = loadingState.error?.message;
	});

	onMount(async () => {
		await analyticsOverview.fetch();
	});

	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(num);
	}

	function formatPercentage(num: number): string {
		return `${num.toFixed(1)}%`;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

		if (diffHours < 1) {
			const diffMinutes = Math.floor(diffMs / (1000 * 60));
			return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		} else {
			const diffDays = Math.floor(diffHours / 24);
			return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		}
	}
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
			Analytics Overview
		</h2>
		<div class="text-sm text-gray-500 dark:text-gray-400">
			{#if data?.lastUpdated}
				Last updated: {formatDate(data.lastUpdated)}
			{:else}
				Loading...
			{/if}
		</div>
	</div>

	{#if error}
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
			<div class="text-red-800 dark:text-red-200 text-sm">
				<strong>Error loading analytics:</strong> {error}
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each Array(8) as _}
				<div class="animate-pulse">
					<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
					<div class="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
					<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
				</div>
			{/each}
		</div>
	{:else if data}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<!-- Total Projects -->
			<div class="analytics-card">
				<div class="analytics-label">Total Projects</div>
				<div class="analytics-metric text-blue-600 dark:text-blue-400">
					{formatNumber(data.totalProjects)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					+{formatNumber(data.newProjectsThisWeek)} this week
				</div>
			</div>

			<!-- Bacteria Count -->
			<div class="analytics-card">
				<div class="analytics-label">Bacteria</div>
				<div class="analytics-metric text-blue-600 dark:text-blue-400">
					{formatNumber(data.bacteriaProjects)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					{formatPercentage((data.bacteriaProjects / data.totalProjects) * 100)} of total
				</div>
			</div>

			<!-- Archaea Count -->
			<div class="analytics-card">
				<div class="analytics-label">Archaea</div>
				<div class="analytics-metric text-red-600 dark:text-red-400">
					{formatNumber(data.archaeaProjects)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					{formatPercentage((data.archaeaProjects / data.totalProjects) * 100)} of total
				</div>
			</div>

			<!-- Growth Rate -->
			<div class="analytics-card">
				<div class="analytics-label">Growth Rate</div>
				<div class="analytics-metric {data.growthRate > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
					{data.growthRate > 0 ? '+' : ''}{formatPercentage(data.growthRate)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Week-over-week change
				</div>
			</div>

			<!-- New Projects This Week -->
			<div class="analytics-card">
				<div class="analytics-label">New This Week</div>
				<div class="analytics-metric text-green-600 dark:text-green-400">
					{formatNumber(data.newProjectsThisWeek)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					New genome projects
				</div>
			</div>

			<!-- Data Extraction Success -->
			<div class="analytics-card">
				<div class="analytics-label">Extraction Success</div>
				<div class="analytics-metric text-purple-600 dark:text-purple-400">
					99.8%
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					JGI API success rate
				</div>
			</div>

			<!-- Processing Speed -->
			<div class="analytics-card">
				<div class="analytics-label">Processing Speed</div>
				<div class="analytics-metric text-indigo-600 dark:text-indigo-400">
					&lt;2s
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Average response time
				</div>
			</div>

			<!-- Data Freshness -->
			<div class="analytics-card">
				<div class="analytics-label">Data Freshness</div>
				<div class="analytics-metric text-yellow-600 dark:text-yellow-400">
					24h
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Daily update cycle
				</div>
			</div>
		</div>

		<!-- Domain Distribution Chart -->
		<div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
			<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
				Domain Distribution
			</h3>
			<div class="flex items-center space-x-8">
				<div class="flex-1">
					<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
						<div
							class="h-full bg-blue-500"
							style="width: {(data.bacteriaProjects / data.totalProjects) * 100}%"
						></div>
						<div
							class="h-full bg-red-500"
							style="width: {(data.archaeaProjects / data.totalProjects) * 100}%"
						></div>
					</div>
					<div class="flex justify-between mt-2 text-sm">
						<span class="text-blue-600 dark:text-blue-400">
							Bacteria ({formatPercentage((data.bacteriaProjects / data.totalProjects) * 100)})
						</span>
						<span class="text-red-600 dark:text-red-400">
							Archaea ({formatPercentage((data.archaeaProjects / data.totalProjects) * 100)})
						</span>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-8 text-gray-500 dark:text-gray-400">
			No data available
		</div>
	{/if}
</div>