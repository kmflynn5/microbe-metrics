<script lang="ts">
	import { onMount } from "svelte";
	import { recentActivity } from "../stores/analytics";
	import type { ActivityItem } from "../types/analytics";

	let activities: ActivityItem[] = $state([]);
	let loading = $state(true);
	let error = $state<string | undefined>(undefined);

	// Subscribe to store
	recentActivity.subscribe((value) => {
		activities = value || [];
	});

	recentActivity.loading((loadingState) => {
		loading = loadingState.isLoading;
		error = loadingState.error?.message;
	});

	onMount(async () => {
		await recentActivity.fetch();
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

	function getActivityIcon(type: string): string {
		switch (type) {
			case "extraction":
				return "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z";
			case "processing":
				return "M12 4.5v15m7.5-7.5h-15";
			case "analysis":
				return "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z";
			default:
				return "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z";
		}
	}

	function getActivityColor(type: string): string {
		switch (type) {
			case "extraction":
				return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20";
			case "processing":
				return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20";
			case "analysis":
				return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20";
			default:
				return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20";
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case "success":
				return "bg-green-400";
			case "warning":
				return "bg-yellow-400";
			case "error":
				return "bg-red-400";
			default:
				return "bg-gray-400";
		}
	}
</script>

<div
	class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
>
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
		<button
			class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
		>
			View All
		</button>
	</div>

	{#if error}
		<div
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
		>
			<div class="text-red-800 dark:text-red-200 text-sm">
				<strong>Error loading activity:</strong>
				{error}
			</div>
		</div>
	{:else if loading}
		<div class="space-y-4">
			{#each Array(5) as _}
				<div class="flex items-start space-x-3 animate-pulse">
					<div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
					<div class="flex-1 space-y-2">
						<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
						<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
						<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if activities.length > 0}
		<div class="space-y-4">
			{#each activities as activity}
				<div
					class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
				>
					<!-- Activity Icon -->
					<div class="flex-shrink-0">
						<div
							class="w-10 h-10 rounded-full flex items-center justify-center {getActivityColor(
								activity.type,
							)}"
						>
							<svg
								class="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d={getActivityIcon(activity.type)}
								/>
							</svg>
						</div>
					</div>

					<!-- Activity Content -->
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-gray-900 dark:text-white capitalize">
							{activity.type.replace("_", " ")}
						</div>
						<div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
							{activity.message}
						</div>
						<div class="text-xs text-gray-500 dark:text-gray-500 mt-2">
							{formatDate(activity.timestamp)}
						</div>
					</div>

					<!-- Activity Status Indicator -->
					<div class="flex-shrink-0">
						<div class="w-2 h-2 rounded-full {getStatusColor(activity.status)}"></div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Activity Summary -->
		<div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
			<div class="grid grid-cols-2 gap-4 text-center">
				<div>
					<div class="text-2xl font-bold text-gray-900 dark:text-white">
						{activities.filter((a) => a.type === "extraction").length}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">Extractions</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-gray-900 dark:text-white">
						{activities.filter((a) => a.type === "processing").length}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">Processing</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-8 text-gray-500 dark:text-gray-400">No recent activity</div>
	{/if}
</div>
