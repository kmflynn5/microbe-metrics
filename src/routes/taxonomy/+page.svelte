<script lang="ts">
	import TaxonomySunburst from "$lib/components/visualizations/TaxonomySunburst.svelte";
	import { onMount } from "svelte";

	interface TaxonomyNode {
		name: string;
		value?: number;
		children?: TaxonomyNode[];
	}

	let taxonomyData: TaxonomyNode = $state({ name: "Genomes", children: [] });

	onMount(async () => {
		await fetchTaxonomyData();
	});

	async function fetchTaxonomyData() {
		// Generate mock hierarchical taxonomy data
		// In production, this would come from the API
		const mockData: TaxonomyNode = {
			name: "Genomes",
			children: [
				{
					name: "Archaea",
					children: [
						{
							name: "Thaumarchaeota",
							children: [
								{ name: "Nitrososphaera", value: 45 },
								{ name: "Nitrosopumilus", value: 32 },
								{ name: "Cenarchaeum", value: 28 },
							],
						},
						{
							name: "Euryarchaeota",
							children: [
								{ name: "Methanococcus", value: 38 },
								{ name: "Methanobrevibacter", value: 42 },
								{ name: "Halobacterium", value: 35 },
								{ name: "Thermococcus", value: 29 },
							],
						},
						{
							name: "Crenarchaeota",
							children: [
								{ name: "Sulfolobus", value: 31 },
								{ name: "Pyrobaculum", value: 25 },
							],
						},
					],
				},
				{
					name: "Bacteria",
					children: [
						{
							name: "Proteobacteria",
							children: [
								{ name: "Escherichia", value: 65 },
								{ name: "Pseudomonas", value: 52 },
								{ name: "Salmonella", value: 48 },
								{ name: "Rhizobium", value: 41 },
							],
						},
						{
							name: "Firmicutes",
							children: [
								{ name: "Bacillus", value: 58 },
								{ name: "Clostridium", value: 44 },
								{ name: "Staphylococcus", value: 39 },
							],
						},
						{
							name: "Actinobacteria",
							children: [
								{ name: "Streptomyces", value: 47 },
								{ name: "Mycobacterium", value: 36 },
							],
						},
						{
							name: "Bacteroidetes",
							children: [
								{ name: "Bacteroides", value: 42 },
								{ name: "Flavobacterium", value: 33 },
							],
						},
					],
				},
			],
		};

		taxonomyData = mockData;
	}
</script>

<svelte:head>
	<title>Taxonomy Explorer - JGI Genomics Analytics</title>
	<meta
		name="description"
		content="Interactive taxonomic hierarchy visualization of genome collection"
	/>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Hero Section -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Taxonomy Explorer</h1>
		<p class="text-lg text-gray-600 dark:text-gray-300">
			Interactive hierarchical visualization of genome collection by taxonomic classification
		</p>
	</div>

	<!-- Visualization -->
	<div
		class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-8"
	>
		<div class="mb-6">
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Taxonomic Hierarchy</h2>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Click on any segment to zoom in and explore deeper levels of the taxonomy
			</p>
		</div>

		<div class="flex justify-center">
			{#if taxonomyData.children && taxonomyData.children.length > 0}
				<TaxonomySunburst data={taxonomyData} width={800} height={800} />
			{:else}
				<div class="text-center py-12">
					<p class="text-gray-500 dark:text-gray-400">Loading taxonomy data...</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Information Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
		>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Navigation</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Click any arc to zoom in on that taxonomic group. Click the center to zoom out.
			</p>
		</div>

		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
		>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Color Coding</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Colors represent different taxonomic levels, making it easy to identify domains, phyla, and
				genera.
			</p>
		</div>

		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
		>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Size Indicates Count</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Arc size is proportional to the number of genome projects in each taxonomic group.
			</p>
		</div>
	</div>
</div>
