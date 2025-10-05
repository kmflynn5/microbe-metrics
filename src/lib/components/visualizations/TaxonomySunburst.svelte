<script lang="ts">
	import { onMount } from "svelte";
	import * as d3 from "d3";

	interface TaxonomyNode {
		name: string;
		children?: TaxonomyNode[];
		value?: number;
	}

	interface Props {
		data?: TaxonomyNode;
		title?: string;
		width?: number;
		height?: number;
	}

	let {
		data = { name: "Root", children: [] },
		title = "Taxonomy Hierarchy",
		width = 600,
		height = 600,
	}: Props = $props();

	let chartContainer: HTMLDivElement;
	let mounted = $state(false);
	let breadcrumbs = $state<string[]>(["All Organisms"]);

	onMount(() => {
		mounted = true;
		renderChart();
	});

	$effect(() => {
		if (mounted && data.children && data.children.length > 0) {
			renderChart();
		}
	});

	function renderChart() {
		if (!chartContainer || !data.children || data.children.length === 0) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll("*").remove();

		const radius = Math.min(width, height) / 2;

		// Create SVG
		const svg = d3
			.select(chartContainer)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", `translate(${width / 2},${height / 2})`);

		// Create hierarchy
		const hierarchy = d3
			.hierarchy(data)
			.sum((d) => d.value || 1)
			.sort((a, b) => (b.value || 0) - (a.value || 0));

		// Create partition layout
		const partition = d3.partition<TaxonomyNode>().size([2 * Math.PI, radius]);

		// Apply partition and cast to rectangular node type
		const root = partition(hierarchy) as d3.HierarchyRectangularNode<TaxonomyNode>;

		// Color scale by depth
		const colorScale = d3
			.scaleOrdinal(d3.schemeCategory10)
			.domain(root.descendants().map((d) => d.data.name));

		// Arc generator
		const arc = d3
			.arc<d3.HierarchyRectangularNode<TaxonomyNode>>()
			.startAngle((d) => d.x0)
			.endAngle((d) => d.x1)
			.padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
			.padRadius(radius / 2)
			.innerRadius((d) => d.y0)
			.outerRadius((d) => d.y1 - 1);

		// Create arcs
		const paths = svg
			.selectAll("path")
			.data(root.descendants().filter((d) => d.depth > 0))
			.enter()
			.append("path")
			.attr("d", arc as any)
			.attr("fill", (d) => {
				// Color by top-level domain
				while (d.depth > 1) d = d.parent!;
				return colorScale(d.data.name);
			})
			.attr("fill-opacity", (d) => 0.6 + d.depth * 0.1)
			.attr("stroke", "white")
			.attr("stroke-width", 1)
			.style("cursor", "pointer")
			.on("click", clicked)
			.on("mouseover", function (event, d) {
				d3.select(this).attr("fill-opacity", 1);

				tooltip
					.style("visibility", "visible")
					.html(`<strong>${d.data.name}</strong><br/>Depth: ${d.depth}<br/>Count: ${d.value || 0}`);
			})
			.on("mousemove", function (event) {
				tooltip.style("top", event.pageY - 10 + "px").style("left", event.pageX + 10 + "px");
			})
			.on("mouseout", function (event, d) {
				d3.select(this).attr("fill-opacity", 0.6 + d.depth * 0.1);
				tooltip.style("visibility", "hidden");
			});

		// Add labels for larger segments
		svg
			.selectAll("text")
			.data(
				root.descendants().filter((d) => d.depth > 0 && d.x1 - d.x0 > 0.1), // Only show labels for segments large enough
			)
			.enter()
			.append("text")
			.attr("transform", function (d) {
				const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
				const y = (d.y0 + d.y1) / 2;
				return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
			})
			.attr("dy", "0.35em")
			.attr("text-anchor", "middle")
			.style("font-size", "10px")
			.style("fill", "white")
			.style("pointer-events", "none")
			.text((d) => (d.x1 - d.x0 > 0.15 ? d.data.name : ""));

		// Add center circle
		svg
			.append("circle")
			.attr("r", radius / 3)
			.attr("fill", "#f3f4f6")
			.attr("stroke", "#d1d5db")
			.attr("stroke-width", 2)
			.style("cursor", "pointer")
			.on("click", () => clicked(null, root));

		svg
			.append("text")
			.attr("text-anchor", "middle")
			.attr("dy", "0.35em")
			.style("font-size", "16px")
			.style("font-weight", "bold")
			.attr("fill", "#1f2937")
			.text("All");

		// Add tooltip
		const tooltip = d3
			.select(chartContainer)
			.append("div")
			.style("position", "absolute")
			.style("visibility", "hidden")
			.style("background-color", "rgba(0, 0, 0, 0.8)")
			.style("color", "white")
			.style("padding", "8px 12px")
			.style("border-radius", "4px")
			.style("font-size", "12px")
			.style("pointer-events", "none")
			.style("z-index", "1000");

		// Click handler for zoom
		function clicked(event: any, p: d3.HierarchyRectangularNode<TaxonomyNode> | null): void {
			const target = p || root;

			// Update breadcrumbs
			const ancestors = target.ancestors().reverse();
			breadcrumbs = ancestors.map((d) => d.data.name);

			root.each((d: any) => {
				const rectNode = d as d3.HierarchyRectangularNode<TaxonomyNode>;
				d.target = {
					x0:
						Math.max(0, Math.min(1, (rectNode.x0 - target.x0) / (target.x1 - target.x0))) *
						2 *
						Math.PI,
					x1:
						Math.max(0, Math.min(1, (rectNode.x1 - target.x0) / (target.x1 - target.x0))) *
						2 *
						Math.PI,
					y0: Math.max(0, rectNode.y0 - target.depth),
					y1: Math.max(0, rectNode.y1 - target.depth),
				};
			});

			const t = svg.transition().duration(750);

			paths
				.transition(t as any)
				.tween("data", (d: any) => {
					const i = d3.interpolate(d.current, d.target);
					return (t: number) => (d.current = i(t));
				})
				.attrTween("d", (d: any) => () => arc(d.current) || "");
		}
	}
</script>

<div class="taxonomy-sunburst">
	<h3 class="chart-title">{title}</h3>

	<!-- Breadcrumb navigation -->
	{#if breadcrumbs.length > 1}
		<div class="breadcrumbs">
			{#each breadcrumbs as crumb, i}
				<span class="breadcrumb">
					{crumb}
					{#if i < breadcrumbs.length - 1}
						<span class="separator">›</span>
					{/if}
				</span>
			{/each}
		</div>
	{/if}

	<div bind:this={chartContainer} class="chart-container"></div>

	{#if !data.children || data.children.length === 0}
		<div class="empty-state">
			<p>No taxonomy data available yet</p>
		</div>
	{/if}
</div>

<style>
	.taxonomy-sunburst {
		width: 100%;
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.chart-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #1f2937;
		text-align: center;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.separator {
		color: #d1d5db;
	}

	.chart-container {
		position: relative;
		width: 100%;
		display: flex;
		justify-content: center;
		overflow: visible;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		color: #6b7280;
	}

	:global(.dark) .taxonomy-sunburst {
		background: #1f2937;
	}

	:global(.dark) .chart-title {
		color: #f3f4f6;
	}
</style>
