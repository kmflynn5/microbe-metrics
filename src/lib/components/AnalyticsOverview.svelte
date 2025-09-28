<script lang="ts">
	import { onMount } from 'svelte';

	// Mock data - in real implementation this would come from API
	let analyticsData = $state({
		totalOrganisms: 45234,
		bacteriaCount: 38902,
		archaeaCount: 6332,
		newThisWeek: 127,
		avgQualityScore: 94.2,
		completedProjects: 892,
		activeCenters: 23,
		dataFreshness: '2 hours ago'
	});

	let loading = $state(true);

	onMount(async () => {
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		loading = false;
	});

	function formatNumber(num: number): string {
		return new Intl.NumberFormat().format(num);
	}

	function formatPercentage(num: number): string {
		return `${num.toFixed(1)}%`;
	}
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
			Analytics Overview
		</h2>
		<div class="text-sm text-gray-500 dark:text-gray-400">
			Last updated: {analyticsData.dataFreshness}
		</div>
	</div>

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
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<!-- Total Organisms -->
			<div class="analytics-card">
				<div class="analytics-label">Total Organisms</div>
				<div class="analytics-metric text-blue-600 dark:text-blue-400">
					{formatNumber(analyticsData.totalOrganisms)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					+{formatNumber(analyticsData.newThisWeek)} this week
				</div>
			</div>

			<!-- Bacteria Count -->
			<div class="analytics-card">
				<div class="analytics-label">Bacteria</div>
				<div class="analytics-metric text-blue-600 dark:text-blue-400">
					{formatNumber(analyticsData.bacteriaCount)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					{formatPercentage((analyticsData.bacteriaCount / analyticsData.totalOrganisms) * 100)} of total
				</div>
			</div>

			<!-- Archaea Count -->
			<div class="analytics-card">
				<div class="analytics-label">Archaea</div>
				<div class="analytics-metric text-red-600 dark:text-red-400">
					{formatNumber(analyticsData.archaeaCount)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					{formatPercentage((analyticsData.archaeaCount / analyticsData.totalOrganisms) * 100)} of total
				</div>
			</div>

			<!-- Average Quality Score -->
			<div class="analytics-card">
				<div class="analytics-label">Avg Quality Score</div>
				<div class="analytics-metric quality-high">
					{formatPercentage(analyticsData.avgQualityScore)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Completeness metric
				</div>
			</div>

			<!-- Completed Projects -->
			<div class="analytics-card">
				<div class="analytics-label">Completed Projects</div>
				<div class="analytics-metric text-green-600 dark:text-green-400">
					{formatNumber(analyticsData.completedProjects)}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Sequencing projects
				</div>
			</div>

			<!-- Active Sequencing Centers -->
			<div class="analytics-card">
				<div class="analytics-label">Active Centers</div>
				<div class="analytics-metric text-yellow-600 dark:text-yellow-400">
					{analyticsData.activeCenters}
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Sequencing facilities
				</div>
			</div>

			<!-- Data Processing Rate -->
			<div class="analytics-card">
				<div class="analytics-label">Processing Rate</div>
				<div class="analytics-metric text-purple-600 dark:text-purple-400">
					98.7%
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Pipeline success rate
				</div>
			</div>

			<!-- Data Volume -->
			<div class="analytics-card">
				<div class="analytics-label">Data Volume</div>
				<div class="analytics-metric text-indigo-600 dark:text-indigo-400">
					2.4TB
				</div>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					Processed this month
				</div>
			</div>
		</div>

		<!-- Organism Distribution Chart -->
		<div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
			<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
				Organism Distribution
			</h3>
			<div class="flex items-center space-x-8">
				<div class="flex-1">
					<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
						<div
							class="h-full bg-gradient-to-r from-blue-500 to-red-500"
							style="width: 100%"
						></div>
					</div>
					<div class="flex justify-between mt-2 text-sm">
						<span class="text-blue-600 dark:text-blue-400">
							Bacteria ({formatPercentage((analyticsData.bacteriaCount / analyticsData.totalOrganisms) * 100)})
						</span>
						<span class="text-red-600 dark:text-red-400">
							Archaea ({formatPercentage((analyticsData.archaeaCount / analyticsData.totalOrganisms) * 100)})
						</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>