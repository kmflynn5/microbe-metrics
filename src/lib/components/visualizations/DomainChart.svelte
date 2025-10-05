<script lang="ts">
	import { onMount } from "svelte";
	import * as d3 from "d3";

	interface DomainData {
		domain: string;
		count: number;
	}

	interface Props {
		archaeaCount?: number;
		bacteriaCount?: number;
		title?: string;
		width?: number;
		height?: number;
	}

	let {
		archaeaCount = 0,
		bacteriaCount = 0,
		title = "Domain Distribution",
		width = 400,
		height = 400,
	}: Props = $props();

	let chartContainer: HTMLDivElement;
	let mounted = $state(false);

	const data = $derived<DomainData[]>(
		[
			{ domain: "Bacteria", count: bacteriaCount },
			{ domain: "Archaea", count: archaeaCount },
		].filter((d) => d.count > 0),
	);

	const total = $derived(archaeaCount + bacteriaCount);

	onMount(() => {
		mounted = true;
		renderChart();
	});

	$effect(() => {
		if (mounted && total > 0) {
			renderChart();
		}
	});

	function renderChart() {
		if (!chartContainer || total === 0) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll("*").remove();

		const radius = Math.min(width, height) / 2;
		const innerRadius = radius * 0.6; // Donut hole size

		// Create SVG
		const svg = d3
			.select(chartContainer)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", `translate(${width / 2},${height / 2})`);

		// Color scale
		const colorScale = d3
			.scaleOrdinal<string>()
			.domain(["Bacteria", "Archaea"])
			.range(["#3b82f6", "#10b981"]);

		// Pie layout
		const pie = d3
			.pie<DomainData>()
			.value((d) => d.count)
			.sort(null);

		// Arc generator
		const arc = d3.arc<d3.PieArcDatum<DomainData>>().innerRadius(innerRadius).outerRadius(radius);

		// Arc for hover effect
		const arcHover = d3
			.arc<d3.PieArcDatum<DomainData>>()
			.innerRadius(innerRadius)
			.outerRadius(radius * 1.05);

		// Create arcs
		const arcs = svg.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc");

		// Add path for each arc
		arcs
			.append("path")
			.attr("d", arc)
			.attr("fill", (d) => colorScale(d.data.domain))
			.attr("stroke", "white")
			.attr("stroke-width", 2)
			.style("cursor", "pointer")
			.on("mouseover", function (event, d) {
				d3.select(this)
					.transition()
					.duration(200)
					.attr("d", arcHover as any);

				tooltip
					.style("visibility", "visible")
					.html(
						`<strong>${d.data.domain}</strong><br/>Count: ${d.data.count.toLocaleString()}<br/>Percentage: ${((d.data.count / total) * 100).toFixed(1)}%`,
					);
			})
			.on("mousemove", function (event) {
				tooltip.style("top", event.pageY - 10 + "px").style("left", event.pageX + 10 + "px");
			})
			.on("mouseout", function () {
				d3.select(this)
					.transition()
					.duration(200)
					.attr("d", arc as any);

				tooltip.style("visibility", "hidden");
			});

		// Add percentage labels
		arcs
			.append("text")
			.attr("transform", (d) => `translate(${arc.centroid(d)})`)
			.attr("dy", "0.35em")
			.attr("text-anchor", "middle")
			.style("fill", "white")
			.style("font-size", "18px")
			.style("font-weight", "bold")
			.style("pointer-events", "none")
			.text((d) => `${((d.data.count / total) * 100).toFixed(1)}%`);

		// Add center text showing total
		svg
			.append("text")
			.attr("text-anchor", "middle")
			.attr("dy", "-0.5em")
			.style("font-size", "32px")
			.style("font-weight", "bold")
			.attr("fill", "currentColor")
			.text(total.toLocaleString());

		svg
			.append("text")
			.attr("text-anchor", "middle")
			.attr("dy", "1.5em")
			.style("font-size", "14px")
			.attr("fill", "currentColor")
			.text("Total Genomes");

		// Add legend
		const legend = svg
			.selectAll(".legend")
			.data(data)
			.enter()
			.append("g")
			.attr("class", "legend")
			.attr("transform", (d, i) => `translate(${radius + 20},${-radius + i * 25 + 40})`);

		legend
			.append("rect")
			.attr("width", 18)
			.attr("height", 18)
			.attr("fill", (d) => colorScale(d.domain));

		legend
			.append("text")
			.attr("x", 24)
			.attr("y", 9)
			.attr("dy", ".35em")
			.attr("fill", "currentColor")
			.style("font-size", "14px")
			.text((d) => `${d.domain}: ${d.count.toLocaleString()}`);

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
	}
</script>

<div class="domain-chart">
	<h3 class="chart-title">{title}</h3>
	<div bind:this={chartContainer} class="chart-container"></div>
	{#if total === 0}
		<div class="empty-state">
			<p>No domain data available yet</p>
		</div>
	{/if}
</div>

<style>
	.domain-chart {
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
		min-height: 200px;
		color: #6b7280;
	}

	:global(.dark) .domain-chart {
		background: #1f2937;
	}

	:global(.dark) .chart-title {
		color: #f3f4f6;
	}
</style>
