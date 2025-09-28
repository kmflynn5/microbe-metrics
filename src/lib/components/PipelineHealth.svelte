<script lang="ts">
	import { onMount } from 'svelte';

	// Mock pipeline health data
	let pipelineData = $state({
		status: 'healthy',
		lastRun: '2 hours ago',
		nextRun: 'in 22 hours',
		successRate: 98.7,
		avgProcessingTime: 45,
		dataQualityScore: 94.2,
		warnings: 1,
		errors: 0,
		recentRuns: [
			{ id: 'run-001', status: 'success', duration: 42, organisms: 127, timestamp: '2 hours ago' },
			{ id: 'run-002', status: 'success', duration: 38, organisms: 134, timestamp: '1 day ago' },
			{ id: 'run-003', status: 'warning', duration: 67, organisms: 98, timestamp: '2 days ago' },
			{ id: 'run-004', status: 'success', duration: 41, organisms: 156, timestamp: '3 days ago' },
			{ id: 'run-005', status: 'success', duration: 39, organisms: 142, timestamp: '4 days ago' }
		]
	});

	let loading = $state(true);

	onMount(async () => {
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 800));
		loading = false;
	});

	function getStatusColor(status: string): string {
		switch (status) {
			case 'healthy':
			case 'success':
				return 'text-green-600 dark:text-green-400';
			case 'warning':
				return 'text-yellow-600 dark:text-yellow-400';
			case 'error':
			case 'failure':
				return 'text-red-600 dark:text-red-400';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
	}

	function getStatusIcon(status: string): string {
		switch (status) {
			case 'healthy':
			case 'success':
				return 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
			case 'warning':
				return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.942 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z';
			case 'error':
			case 'failure':
				return 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
			default:
				return 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z';
		}
	}
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
			Pipeline Health
		</h2>
		{#if !loading}
			<div class="flex items-center space-x-2">
				<svg class="w-5 h-5 {getStatusColor(pipelineData.status)}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d={getStatusIcon(pipelineData.status)} />
				</svg>
				<span class="text-sm font-medium {getStatusColor(pipelineData.status)} capitalize">
					{pipelineData.status}
				</span>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="space-y-4">
			{#each Array(6) as _}
				<div class="animate-pulse">
					<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
					<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Pipeline Status Summary -->
		<div class="grid grid-cols-2 gap-4 mb-6">
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400">Last Run</div>
				<div class="text-lg font-semibold text-gray-900 dark:text-white">
					{pipelineData.lastRun}
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400">Next Run</div>
				<div class="text-lg font-semibold text-gray-900 dark:text-white">
					{pipelineData.nextRun}
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
				<div class="text-lg font-semibold quality-high">
					{pipelineData.successRate}%
				</div>
			</div>
			<div>
				<div class="text-sm text-gray-600 dark:text-gray-400">Avg Duration</div>
				<div class="text-lg font-semibold text-gray-900 dark:text-white">
					{pipelineData.avgProcessingTime}m
				</div>
			</div>
		</div>

		<!-- Alerts Summary -->
		<div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
			<div class="flex items-center justify-between">
				<h3 class="text-sm font-medium text-gray-900 dark:text-white">
					Active Alerts
				</h3>
				<div class="flex items-center space-x-4 text-sm">
					<div class="flex items-center space-x-1">
						<div class="w-2 h-2 rounded-full bg-yellow-400"></div>
						<span class="text-gray-600 dark:text-gray-400">
							{pipelineData.warnings} warnings
						</span>
					</div>
					<div class="flex items-center space-x-1">
						<div class="w-2 h-2 rounded-full bg-red-400"></div>
						<span class="text-gray-600 dark:text-gray-400">
							{pipelineData.errors} errors
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Recent Pipeline Runs -->
		<div>
			<h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
				Recent Runs
			</h3>
			<div class="space-y-2">
				{#each pipelineData.recentRuns as run}
					<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
						<div class="flex items-center space-x-3">
							<svg class="w-4 h-4 {getStatusColor(run.status)}" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d={getStatusIcon(run.status)} />
							</svg>
							<div>
								<div class="text-sm font-medium text-gray-900 dark:text-white">
									Run {run.id}
								</div>
								<div class="text-xs text-gray-600 dark:text-gray-400">
									{run.organisms} organisms • {run.duration}m • {run.timestamp}
								</div>
							</div>
						</div>
						<div class="text-xs text-gray-500 dark:text-gray-400 capitalize">
							{run.status}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Quick Actions -->
		<div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
			<div class="flex space-x-3">
				<button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
					View Details
				</button>
				<button class="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200">
					Download Logs
				</button>
			</div>
		</div>
	{/if}
</div>