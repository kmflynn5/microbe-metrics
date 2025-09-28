<script lang="ts">
	import { onMount } from 'svelte';

	// Mock recent activity data
	let activityData = $state({
		activities: [
			{
				id: 'act-001',
				type: 'organism_added',
				title: 'New Bacteria Species Processed',
				description: 'Bacillus subtilis strain XJ-42 completed quality assessment',
				timestamp: '2 hours ago',
				metadata: { organism_type: 'bacteria', quality_score: 96.4 }
			},
			{
				id: 'act-002',
				type: 'pipeline_run',
				title: 'Daily Pipeline Execution',
				description: '127 new organisms processed successfully',
				timestamp: '2 hours ago',
				metadata: { organisms_count: 127, duration: '42 minutes' }
			},
			{
				id: 'act-003',
				type: 'quality_alert',
				title: 'Quality Alert Resolved',
				description: 'Contamination threshold warning for batch-2024-092',
				timestamp: '5 hours ago',
				metadata: { alert_type: 'warning', resolution: 'automated' }
			},
			{
				id: 'act-004',
				type: 'organism_added',
				title: 'Archaea Genome Analyzed',
				description: 'Methanococcus jannaschii new strain sequencing complete',
				timestamp: '8 hours ago',
				metadata: { organism_type: 'archaea', quality_score: 92.1 }
			},
			{
				id: 'act-005',
				type: 'discovery',
				title: 'New Genus Identified',
				description: 'Novel Pseudomonas species discovered in marine sample',
				timestamp: '1 day ago',
				metadata: { novelty_score: 'high', classification: 'new_genus' }
			},
			{
				id: 'act-006',
				type: 'pipeline_run',
				title: 'Weekly Analysis Complete',
				description: 'Cross-validation with NCBI database completed',
				timestamp: '1 day ago',
				metadata: { validation_rate: 98.2, external_matches: 445 }
			}
		]
	});

	let loading = $state(true);

	onMount(async () => {
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 600));
		loading = false;
	});

	function getActivityIcon(type: string): string {
		switch (type) {
			case 'organism_added':
				return 'M12 4.5v15m7.5-7.5h-15';
			case 'pipeline_run':
				return 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z';
			case 'quality_alert':
				return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.942 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z';
			case 'discovery':
				return 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z';
			default:
				return 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';
		}
	}

	function getActivityColor(type: string): string {
		switch (type) {
			case 'organism_added':
				return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
			case 'pipeline_run':
				return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
			case 'quality_alert':
				return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
			case 'discovery':
				return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
			default:
				return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
		}
	}

	function formatMetadata(metadata: Record<string, any>): string {
		const entries = Object.entries(metadata);
		if (entries.length === 0) return '';

		return entries
			.slice(0, 2) // Show only first 2 metadata items
			.map(([key, value]) => `${key}: ${value}`)
			.join(' • ');
	}
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
			Recent Activity
		</h2>
		<button class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
			View All
		</button>
	</div>

	{#if loading}
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
	{:else}
		<div class="space-y-4">
			{#each activityData.activities as activity}
				<div class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
					<!-- Activity Icon -->
					<div class="flex-shrink-0">
						<div class="w-10 h-10 rounded-full flex items-center justify-center {getActivityColor(activity.type)}">
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d={getActivityIcon(activity.type)} />
							</svg>
						</div>
					</div>

					<!-- Activity Content -->
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-gray-900 dark:text-white">
							{activity.title}
						</div>
						<div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
							{activity.description}
						</div>
						{#if Object.keys(activity.metadata).length > 0}
							<div class="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
								{formatMetadata(activity.metadata)}
							</div>
						{/if}
						<div class="text-xs text-gray-500 dark:text-gray-500 mt-2">
							{activity.timestamp}
						</div>
					</div>

					<!-- Activity Status Indicator -->
					<div class="flex-shrink-0">
						{#if activity.type === 'organism_added'}
							<div class="w-2 h-2 rounded-full bg-green-400"></div>
						{:else if activity.type === 'pipeline_run'}
							<div class="w-2 h-2 rounded-full bg-blue-400"></div>
						{:else if activity.type === 'quality_alert'}
							<div class="w-2 h-2 rounded-full bg-yellow-400"></div>
						{:else if activity.type === 'discovery'}
							<div class="w-2 h-2 rounded-full bg-purple-400"></div>
						{:else}
							<div class="w-2 h-2 rounded-full bg-gray-400"></div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Activity Summary -->
		<div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
			<div class="grid grid-cols-2 gap-4 text-center">
				<div>
					<div class="text-2xl font-bold text-gray-900 dark:text-white">
						{activityData.activities.filter(a => a.type === 'organism_added').length}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">
						New Organisms
					</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-gray-900 dark:text-white">
						{activityData.activities.filter(a => a.type === 'pipeline_run').length}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-400">
						Pipeline Runs
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>