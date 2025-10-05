<script lang="ts">
	import { onMount } from "svelte";
	import { pipelineHealth } from "../stores/analytics";
	import type { PipelineHealth } from "../types/analytics";

	let data: PipelineHealth | null = $state(null);
	let loading = $state(true);
	let error = $state<string | undefined>(undefined);

	// Subscribe to store
	$effect(() => {
		const unsubscribe = pipelineHealth.subscribe((value) => {
			data = value;
		});
		return unsubscribe;
	});

	$effect(() => {
		const unsubscribe = pipelineHealth.loading((loadingState) => {
			loading = loadingState.isLoading;
			error = loadingState.error?.message;
		});
		return unsubscribe;
	});

	onMount(async () => {
		await pipelineHealth.fetch();
	});

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

		if (diffHours < 1) {
			const diffMinutes = Math.floor(diffMs / (1000 * 60));
			return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
		} else if (diffHours < 24) {
			return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
		} else {
			const diffDays = Math.floor(diffHours / 24);
			return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
		}
	}

	function getNextScheduledTime(): string {
		// Worker is scheduled daily at 6 AM UTC
		const now = new Date();
		const next = new Date(now);
		next.setUTCHours(6, 0, 0, 0);

		// If 6 AM today has passed, schedule for tomorrow
		if (next <= now) {
			next.setDate(next.getDate() + 1);
		}

		const diffMs = next.getTime() - now.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

		return `in ${diffHours} hours`;
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case "healthy":
			case "success":
				return "text-green-600 dark:text-green-400";
			case "warning":
				return "text-yellow-600 dark:text-yellow-400";
			case "error":
			case "failure":
				return "text-red-600 dark:text-red-400";
			default:
				return "text-gray-600 dark:text-gray-400";
		}
	}

	function getStatusIcon(status: string): string {
		switch (status) {
			case "healthy":
			case "success":
				return "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
			case "warning":
				return "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.942 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z";
			case "error":
			case "failure":
				return "M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
			default:
				return "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z";
		}
	}
</script>

<div
	class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
>
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Pipeline Health</h2>
		{#if !loading && data}
			<div class="flex items-center space-x-2">
				<svg
					class="w-5 h-5 {getStatusColor(data.status)}"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d={getStatusIcon(data.status)} />
				</svg>
				<span class="text-sm font-medium {getStatusColor(data.status)} capitalize">
					{data.status}
				</span>
			</div>
		{/if}
	</div>

	{#if error}
		<div
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
		>
			<div class="text-red-800 dark:text-red-200 text-sm">
				<strong>Error loading pipeline health:</strong>
				{error}
			</div>
		</div>
	{:else if loading}
		<div class="space-y-4">
			{#each Array(6) as _}
				<div class="animate-pulse">
					<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
					<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
				</div>
			{/each}
		</div>
	{:else if data}
		<!-- Pipeline Status Summary -->
		<div class="grid grid-cols-2 gap-4 mb-6">
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400">Last Run</div>
				<div class="text-lg font-semibold text-gray-900 dark:text-white">
					{formatDate(data.lastExtraction)}
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400">Next Run</div>
				<div class="text-lg font-semibold text-gray-900 dark:text-white">
					{getNextScheduledTime()}
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
				<div class="text-lg font-semibold quality-high">
					{((1 - data.errorRate) * 100).toFixed(1)}%
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
				<div class="text-lg font-semibold text-gray-900 dark:text-white">
					{((data.avgProcessingTime ?? 0) / 1000).toFixed(1)}s
				</div>
			</div>
		</div>

		<!-- Stats Summary -->
		<div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-medium text-gray-900 dark:text-white">Pipeline Stats</h3>
				<div class="flex items-center space-x-4 text-sm">
					<div class="flex items-center space-x-1">
						<span class="text-gray-600 dark:text-gray-400">
							Extractions: {data.extractionCount}
						</span>
					</div>
					<div class="flex items-center space-x-1">
						<span class="text-gray-600 dark:text-gray-400">
							Uptime: {(data.uptime ?? 0).toFixed(1)}%
						</span>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-8 text-gray-500 dark:text-gray-400">No pipeline data available</div>
	{/if}
</div>
