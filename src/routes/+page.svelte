<script lang="ts">
	import AnalyticsOverview from "$lib/components/AnalyticsOverview.svelte";
	import PipelineHealth from "$lib/components/PipelineHealth.svelte";
	import RecentActivity from "$lib/components/RecentActivity.svelte";
	import DomainChart from "$lib/components/visualizations/DomainChart.svelte";
	import { analyticsOverview } from "$lib/stores/analytics";
	import { onMount } from "svelte";
	import type { AnalyticsOverview as AnalyticsOverviewType } from "$lib/types/analytics";

	let data: AnalyticsOverviewType | null = $state(null);

	// Subscribe to overview data for visualization
	$effect(() => {
		const unsubscribe = analyticsOverview.subscribe((value) => {
			data = value;
		});
		return unsubscribe;
	});

	onMount(async () => {
		await analyticsOverview.fetch();
	});
</script>

<svelte:head>
	<title>Dashboard - JGI Genomics Analytics</title>
	<meta
		name="description"
		content="Real-time analytics dashboard for JGI bacterial and archaeal genome data pipeline"
	/>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Hero Section -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
			Genomics Analytics Dashboard
		</h1>
		<p class="text-lg text-gray-600 dark:text-gray-300">
			Real-time analysis of JGI bacterial and archaeal genome projects with advanced data pipeline
			monitoring
		</p>
	</div>

	<!-- Analytics Overview -->
	<div class="mb-8">
		<AnalyticsOverview />
	</div>

	<!-- Domain Distribution Visualization -->
	{#if data && (data.archaeaProjects > 0 || data.bacteriaProjects > 0)}
		<div class="mb-8">
			<div
				class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
			>
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
					Domain Distribution
				</h2>
				<div class="flex justify-center">
					<DomainChart
						archaeaCount={data.archaeaProjects}
						bacteriaCount={data.bacteriaProjects}
						width={500}
						height={500}
					/>
				</div>
			</div>
		</div>
	{/if}

	<!-- Pipeline Health and Recent Activity -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
		<PipelineHealth />
		<RecentActivity />
	</div>

	<!-- Key Features -->
	<div
		class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
	>
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Platform Capabilities</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<div class="text-center">
				<div
					class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3"
				>
					<svg
						class="w-6 h-6 text-blue-600 dark:text-blue-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
						/>
					</svg>
				</div>
				<h3 class="font-medium text-gray-900 dark:text-white">Real-time Pipeline</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
					Automated JGI data extraction and processing
				</p>
			</div>

			<div class="text-center">
				<div
					class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3"
				>
					<svg
						class="w-6 h-6 text-green-600 dark:text-green-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
						/>
					</svg>
				</div>
				<h3 class="font-medium text-gray-900 dark:text-white">Advanced Analytics</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
					Complex queries with DuckDB and predictive models
				</p>
			</div>

			<div class="text-center">
				<div
					class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-3"
				>
					<svg
						class="w-6 h-6 text-yellow-600 dark:text-yellow-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				</div>
				<h3 class="font-medium text-gray-900 dark:text-white">Data Visualization</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
					Interactive D3.js charts and research insights
				</p>
			</div>

			<div class="text-center">
				<div
					class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3"
				>
					<svg
						class="w-6 h-6 text-blue-600 dark:text-blue-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c3.808-3.808 10.98-3.808 14.788 0M12 12h.01"
						/>
					</svg>
				</div>
				<h3 class="font-medium text-gray-900 dark:text-white">Quality Monitoring</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
					Data quality assessment and anomaly detection
				</p>
			</div>
		</div>
	</div>
</div>
